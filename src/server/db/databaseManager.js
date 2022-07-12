const mongoose = require("mongoose");

const srvConfig = require("./config/auth");
const Wizard = require("./models/Wizard");
const Players = require("./models/Player");
const GameState = require("./models/GameState");

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
            gameStartTimestamp: Date.now(),
          });
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

  createPlayer(req, res) {
    const { address } = req.body;

    Players.exists({ address }).then((isExsisting) => {
      if (isExsisting) {
        res.sendStatus(403);
      } else {
        Players.create({
          address,
        }).then((player) => {
          // TODO : Handle Errors && Create 4 wizards in one batch Query
          //   .insertMany( [
          //     { "_id" : 1, "grades" : [ 85, 80, 80 ] },
          //     { "_id" : 2, "grades" : [ 88, 90, 92 ] },
          //     { "_id" : 3, "grades" : [ 85, 100, 90 ] }
          //  ] )
          const wizardsQueries = [];
          const sampleNames = ["Eric", "Patrick", "John", "Caroline"];
          // const seed = Math.floor(Math.random() * 1000);

          for (let i = 0; i < 4; ++i) {
            const wizard = Wizard.create({
              x: Math.floor(Math.random() * 600),
              y: Math.floor(Math.random() * 600),
              name: sampleNames[i] + "_" + address, // + seed
              isAlive: true,
              dailyChallengeCompleted: false,
              player: player.id,
            }).then((_wizard) => {
              player.wizards.push(_wizard);
            });

            wizardsQueries.push(wizard);
          }

          Promise.all(wizardsQueries).then(() => {
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
