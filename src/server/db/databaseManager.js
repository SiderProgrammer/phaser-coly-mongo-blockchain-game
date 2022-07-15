const mongoose = require("mongoose");

const srvConfig = require("./config/auth");
const Wizard = require("./models/Wizard");
const Players = require("./models/Player");
const GameState = require("./models/GameState");
const Days = require("./models/Days");
const { PLAYER_SIZE, WORLD_SIZE } = require("../../shared/config");

const DATABASE_URL = `mongodb+srv://${srvConfig.USERNAME}:${srvConfig.PASSWORD}@${srvConfig.HOST}/?retryWrites=true&w=majority`;

class DatabaseManager {
  constructor() {}
  connectDatabase() {
    mongoose
      .connect(DATABASE_URL, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      })
      .then(() => {
        GameState.exists({}).then((isExsisting) => {
          if (isExsisting) return;

          GameState.create({
            day: 1,
            dayDuration: 1000 * 60, // 10 minutes
            gameStartTimestamp: Date.now(),
          });

          Days.insertMany([
            // for now
            { day: 1, slogan: "First day slogan" },
            { day: 2, slogan: "Second day slogan" },
            { day: 3, slogan: "Third day slogan" },
          ]);
        });
      });
  }

  killDelayedWizards() {
    return Wizard.updateMany(
      { dailyChallengeCompleted: false },
      { $set: { isAlive: false } }
    );
  }

  refreshWizardsChallenges() {
    return Wizard.updateMany(
      { dailyChallengeCompleted: true },
      { $set: { dailyChallengeCompleted: false } }
    );
  }

  refreshDay() {
    return GameState.updateOne({}, { $inc: { day: 1 } })
      .then(this.killDelayedWizards)
      .then(this.refreshWizardsChallenges);
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

  getGameStateQuery() {
    return GameState.findOne({}).lean().select("-_id"); // __v
  }

  createPlayer(req, res) {
    const { address } = req.body;

    Players.exists({ address }).then((isExsisting) => {
      if (isExsisting) {
        res.sendStatus(403);
      } else {
        Players.create({
          address,
        }).then((player) => {
          // TODO : Handle Errors

          const sampleNames = ["Eric", "Patrick", "John", "Caroline"];
          const tileSize = PLAYER_SIZE;
          const columns = WORLD_SIZE.WIDTH / tileSize;
          const rows = WORLD_SIZE.HEIGHT / tileSize;

          function getGeneratedWizard(i) {
            return {
              x: tileSize / 2 + Math.floor(Math.random() * columns) * tileSize,
              y: tileSize / 2 + Math.floor(Math.random() * rows) * tileSize,
              name: sampleNames[i] + "_" + address, // + seed
              isAlive: true,
              dailyChallengeCompleted: false,
              player: player.id,
            };
          }

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

  countWizards(condition = {}) {
    // TODO : Handle Errors
    return Wizard.countDocuments(condition);
  }

  getAllPlayers(req, res) {
    // TODO : Handle Errors

    Players.find({}, (err, players) => {
      res.send(players);
    })
      .lean()
      .populate("wizards")
      .select("-_id");
  }

  // ? Methods used from backend

  getPlayerQuery(address) {
    // TODO : Handle Errors

    return Players.findOne({ address })
      .lean()
      .populate("wizards")
      .select("-_id");
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

  savePlayerWizards(address, wizards) {
    // TODO : Handle Errors  && Improve this Query (search for better solution)

    Players.findOne({ address })
      .populate("wizards")
      .then((state) => {
        wizards.forEach((wizard, i) => {
          state.wizards[i].x = wizard.x;
          state.wizards[i].y = wizard.y;
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
}

mongoose.connection.on("error", (error) => {
  console.log("Mongo ERROR", error);
  process.exit(1);
});

mongoose.connection.on("connected", function () {
  console.log("Connected to mongo");
});

module.exports = DatabaseManager;
