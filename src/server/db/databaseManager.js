const mongoose = require("mongoose");

const srvConfig = require("./config/auth");
const Wizard = require("./models/Wizard");
const Players = require("./models/Player");
const GameState = require("./models/GameState");
const CollectedObjects = require("./models/CollectedObjects");
const Days = require("./models/Days");
const {
  PLAYER_SIZE,
  WORLD_SIZE,
  CHALLENGE_PLAYER,
  CHALLENGE_OBSTACLES,
  CHALLENGE_META,
  DAILY_MAX_MOVES,
} = require("../../shared/config");
const Challenge = require("./models/Challenge");
const worldMap = require("../maps/world/sampleMap");
const { randomInRange } = require("../../shared/utils");
const MapGridManager = require("../../shared/mapGridManager");
const MapManager = require("../../shared/mapManager");
const Spawner = require("./helpers/Spawner");

const DATABASE_URL = `mongodb+srv://${srvConfig.USERNAME}:${srvConfig.PASSWORD}@${srvConfig.HOST}/?retryWrites=true&w=majority`;

//TODO : split these methods between files
class DatabaseManager {
  constructor() {
    this.isRegistrationPhase = true;
  }
  async connectDatabase() {
    await mongoose.connect(DATABASE_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    this.spawner = new Spawner(this);

    this.mapGridManager = new MapGridManager(this);
    this.worldGrid = this.mapGridManager.createWorldGrid();

    const playersFromDB = await this.getAllPlayersQuery();

    playersFromDB.forEach((player) =>
      this.mapGridManager.addWizardsToGrid(player.wizards)
    );

    this.mapManager = new MapManager(this, worldMap);
    this.mapLayers = this.mapManager.getWorldMap();
    this.mapGridManager.addLayersToGrid(this.mapLayers);

    const isExsisting = await GameState.exists({});
    if (isExsisting) return;

    const registrationPhaseDuration = 1000 * 60 * 2; // 2 minutes

    await GameState.create({
      day: 1,
      registrationPhaseDuration: registrationPhaseDuration,
      dayDuration: 1000 * 60 * 10, // 10 minutes
      gameStartTimestamp: Date.now(),
    });

    await Days.insertMany([
      // for now
      { day: 1, slogan: "First day slogan" },
      { day: 2, slogan: "Second day slogan" },
      { day: 3, slogan: "Third day slogan" },
      { day: 4, slogan: "Fourth day slogan" },
      { day: 5, slogan: "Fifth day slogan" },
    ]);

    const challengeData = {
      winMessage: "win",
      loseMessage: "lose",
      startPosition: {
        x: CHALLENGE_PLAYER.x,
        y: CHALLENGE_PLAYER.y,
      },
    };

    await Challenge.insertMany([
      // for now
      { ...challengeData, day: 1, dailyMessage: "first day" },
      { ...challengeData, day: 2, dailyMessage: "second day" },
      { ...challengeData, day: 3, dailyMessage: "third day" },
      { ...challengeData, day: 4, dailyMessage: "fourth day" },
      { ...challengeData, day: 5, dailyMessage: "fifth day" },
    ]);

    console.log("DB init");
  }

  getChallenge(req, res) {
    GameState.findOne({})
      .lean()
      .select("-_id")
      .then((state) => {
        Challenge.findOne({ day: state.day })
          .lean()
          .select("-_id")
          .then((challenge) => {
            // TODO : we can filter data here to not send lethals positions client-side
            res.status(200).json(challenge);
          });
      });
  }

  changeName(req, res) {
    const { name, address, wizardId } = req.body;

    Players.findOne({ address }) // ? Maybe Wizards.updateOne({...}) // handle errors
      .populate("wizards")
      .then((state) => {
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

  getGameState(req, res) {
    GameState.findOne({})
      .lean()
      .select("-_id") // __v
      .then((gameState) => {
        Days.findOne({ day: gameState.day })
          .lean()
          .select("-_id") // __v
          .then((dayState) => {
            res.status(200).json({ ...gameState, ...dayState });
          });
      });
  }

  createPlayer(req, res) {
    const { address } = req.body;
    if (!this.isRegistrationPhase) {
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
            const { x, y } = this.spawner.getNewSpawnPosition();

            this.mapGridManager.addWizardToGridAtXY(x, y);

            return {
              x,
              y,
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

  getPlayer(req, res) {
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

  getAllPlayers(req, res) {
    // TODO : Handle Errors
    // don't need all properties
    Players.find({}, (err, players) => {
      res.send(players);
    })
      .lean()
      .populate("wizards")
      .select("-_id");
  }

  setObjectCollected(r, c, type) {
    CollectedObjects.create({ r, c, type });
  }

  getAllCollectedObjects(req, res) {
    CollectedObjects.find()
      .lean()
      .select("-_id")
      .then((objects) => res.status(200).json(objects));
  }

  increaseWizardObjectsCount(address, wizardId, type) {
    // TODO : Handle Errors  && Improve this Query (search for better solution)

    Players.findOne({ address }) // ? Maybe Wizards.updateOne({...})
      .populate("wizards")
      .then((state) => {
        state.wizards[wizardId].collectedObjectsCount[type]++;
        state.wizards[wizardId].save();
      });
  }

  savePlayerWizards(address, wizards) {
    // TODO : Handle Errors  && Improve this Query (search for better solution)

    Players.findOne({ address })
      .populate("wizards")
      .then((state) => {
        wizards.forEach((wizard, i) => {
          state.wizards[i].x = wizard.x;
          state.wizards[i].y = wizard.y;
          state.wizards[i].movesLeft = wizard.movesLeft;
          state.wizards[i].save(); // ? improve saving code
        });
      })
      .catch((err) => {
        console.log(
          "Error while saving player wizards, player wallet address:",
          address,
          "error:",
          err
        );
      });
  }

  // *************************************** METHODS  USED FROM SERVER ********************************

  getPlayerWizardName(address, wizardId) {
    return Players.findOne({ address }) // ? Maybe Wizards.updateOne({...})
      .populate("wizards")
      .then((state) => {
        return state.wizards[wizardId].name;
      });
  }
  canWizardPlayChallenge(address, wizardId) {
    return Players.findOne({ address }) // ? Maybe Wizards.updateOne({...})
      .populate("wizards")
      .then((state) => {
        const wizard = state.wizards[wizardId];
        return !wizard.dailyChallengeCompleted && wizard.isAlive;
      });
  }

  killDelayedWizards() {
    return Wizard.updateMany(
      { dailyChallengeCompleted: false },
      { $set: { isAlive: false } }
    );
  }

  refreshWizards() {
    return Wizard.updateMany(
      { dailyChallengeCompleted: true },
      { $set: { dailyChallengeCompleted: false, movesLeft: DAILY_MAX_MOVES } }
    );
  }

  refreshDay(daysToAdd = 1) {
    return GameState.updateOne({}, { $inc: { day: daysToAdd } })
      .then(this.killDelayedWizards) //TODO:check if these work
      .then(this.refreshWizards); //TODO:check if these work
  }

  getGameStateQuery() {
    return GameState.findOne({}).lean().select("-_id"); // __v
  }
  countWizards(condition = {}) {
    // TODO : Handle Errors
    return Wizard.countDocuments(condition);
  }

  getAllPlayersQuery() {
    // TODO : Handle Errors

    return Players.find({}).lean().populate("wizards").select("-_id");
  }

  getAllCollectedObjectsQuery() {
    return CollectedObjects.find().lean().select("-_id");
  }

  getDayQuery(day) {
    return Days.findOne({ day }).lean().select("-_id"); // __v
  }

  getPlayerQuery(address) {
    // TODO : Handle Errors

    return Players.findOne({ address })
      .lean()
      .populate("wizards")
      .select("-_id");
  }

  getChallengeQuery() {
    return GameState.findOne({})
      .lean()
      .select("-_id")
      .then((state) => {
        return Challenge.findOne({ day: state.day })
          .lean()
          .select("lethals startPosition meta");
      });
  }

  setCompletedDailyChallenge(address, wizardId) {
    return Players.findOne({ address }) // ? Maybe Wizards.updateOne({...})
      .populate("wizards")
      .then((state) => {
        state.wizards[wizardId].dailyChallengeCompleted = true;
        state.wizards[wizardId].save();
      });
  }

  killWizard(address, wizardId) {
    // TODO : Handle Errors  && Improve this Query (search for better solution)

    return Players.findOne({ address }) // ? Maybe Wizards.updateOne({...})
      .populate("wizards")
      .then((state) => {
        state.wizards[wizardId].isAlive = false;
        state.wizards[wizardId].save();
      });
  }
}

mongoose.connection.on("error", (error) => {
  console.log("Mongo ERROR", error);
  process.exit(1);
});

mongoose.connection.on("connected", function () {
  console.log("Connected to mongo");
});

module.exports = DatabaseManager;
