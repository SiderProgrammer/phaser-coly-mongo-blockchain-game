const mongoose = require("mongoose");

const FrontendHandler = require("./handlers/FrontendHandler");
const BackendHandler = require("./handlers/BackendHandler");
const { DB_URL } = require("./config/credentials");

const GameState = require("./models/GameState");

const Days = require("./models/Days");
const { CHALLENGE_PLAYER } = require("../../shared/config");
const Challenge = require("./models/Challenge");
const worldMap = require("../maps/world/sampleMap");
const MapGridManager = require("../../shared/mapGridManager");
const MapManager = require("../../shared/mapManager");
const Spawner = require("./helpers/Spawner");

// TODO : maybe change this class to static class

class DatabaseManager {
  constructor() {
    this.isRegistrationPhase = true;
    this.frontendHandler = new FrontendHandler(this); // sends responses to client
    this.backendHandler = new BackendHandler(this); // return queries
  }

  async connectDatabase() {
    await mongoose
      .connect(DB_URL, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      })
      .then(async () => {
        this.spawner = new Spawner(this);

        this.mapGridManager = new MapGridManager(this);
        this.worldGrid = this.mapGridManager.createWorldGrid();

        const playersFromDB = await this.backendHandler.getAllPlayersQuery();

        playersFromDB.forEach((player) =>
          this.mapGridManager.addWizardsToGrid(player.wizards)
        );

        this.mapManager = new MapManager(this, worldMap);
        this.mapLayers = this.mapManager.getWorldMap();
        this.mapGridManager.addLayersToGrid(this.mapLayers);

        const isExsisting = await GameState.exists({});
        if (isExsisting) return;

        const registrationPhaseDuration = 1000 * 60 * 0.2; // 2 minutes

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
            r: CHALLENGE_PLAYER.r,
            c: CHALLENGE_PLAYER.c,
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
