const Wizard = require("../models/Wizard");
const Players = require("../models/Player");

const CollectedObjects = require("../models/CollectedObjects");
const { DAILY_MAX_MOVES } = require("../../../shared/config");
const Challenge = require("../models/Challenge");
const BaseHandler = require("./BaseHandler");

// backend manager returns queries
// frontend manager sends responses to client
class FrontendHandler extends BaseHandler {
  constructor(main) {
    super();
    this.main = main;
  }

  getChallengeAPI(req, res) {
    this.getGameState().then((state) => {
      Challenge.findOne({ day: state.day })
        .lean()
        .select("-_id")
        .then((challenge) => {
          // TODO : we can filter data here to not send lethals positions client-side
          res.status(200).json(challenge);
        });
    });
  }

  changeNameAPI(req, res) {
    const { name, address, wizardId } = req.body;

    this.findPlayerWizards(address).then((state) => {
      const wizard = state.wizards[wizardId];
      if (!wizard.hasCustomName) {
        wizard.name = name;
        wizard.hasCustomName = true;
        wizard.save();
        res.sendStatus(200);
      } else {
        res.sendStatus(403);
      }
    });
  }

  getGameStateAPI(req, res) {
    this.getGameState().then((gameState) => {
      this.getDayData(gameState.day).then((dayState) => {
        res.status(200).json({ ...gameState, ...dayState });
      });
    });
  }

  createPlayerAPI(req, res) {
    const { address } = req.body;
    if (!this.main.isRegistrationPhase) {
      res.status(401).json({ error: "Registration phase is finished" });
      return;
    }
    Players.exists({ address }).then((isExsisting) => {
      if (isExsisting) {
        res.sendStatus(403);
      } else {
        Players.create({
          address,
        }).then((player) => {
          // TODO : Handle Errors

          const sampleNames = ["Eric", "Patrick", "John", "Caroline"];

          const getGeneratedWizard = (i) => {
            const { r, c } = this.main.spawner.getNewSpawnPosition();

            this.main.mapGridManager.addWizardToGrid({ r, c });

            return {
              r,
              c,
              name: sampleNames[i] + "_" + address,
              isAlive: true,
              dailyChallengeCompleted: false,
              collectedObjectsCount: { 1: 0, 2: 0, 3: 0 },
              player: player.id,
              movesLeft: DAILY_MAX_MOVES,
            };
          };

          //const generatedWizards = // loop 4x getGeneratedWizard(i)

          const createWizards = Wizard.insertMany([
            getGeneratedWizard(0),
            getGeneratedWizard(1),
            getGeneratedWizard(2),
            getGeneratedWizard(3),
          ]);

          createWizards.then((wizards) => {
            player.wizards = wizards;
            player.save();
            res.status(200).json(player);
          });
        });
      }
    });
  }

  getPlayerAPI(req, res) {
    const { address } = req.body;

    // TODO : Handle Errors

    Players.findOne({ address }, (err, player) => {
      if (!player) {
        res.sendStatus(403);
        return;
      }
      res.status(200).json(player);
    })
      .lean()
      .populate("wizards")
      .select("-_id");
  }

  getAllPlayersAPI(req, res) {
    // TODO : Handle Errors
    // don't need all properties
    Players.find({}, (err, players) => {
      res.send(players);
    })
      .lean()
      .populate("wizards")
      .select("-_id");
  }

  getAllCollectedObjectsAPI(req, res) {
    CollectedObjects.find()
      .lean()
      .select("-_id")
      .then((objects) => res.status(200).json(objects));
  }
}

module.exports = FrontendHandler;
