const http = require("http");
const express = require("express");
const cors = require("cors");
const { Server, LocalPresence, matchMaker } = require("@colyseus/core");
const Game = require("./rooms/Game").default;
const Challenge = require("./rooms/Challenge").default;
const DatabaseManager = require("./db/databaseManager");
const { SERVER_PORT } = require("../shared/config");
const path = require("path");
//const cron = require("node-cron");
const MapManager = require("../shared/mapManager");
const { calculateRegistrationPhaseRemainingTime } = require("../shared/utils");

const port = process.env.PORT || SERVER_PORT;
const host = "0.0.0.0";
const app = express();

app.use(cors());
app.use(express.json());

app.use(
  "/",
  express.static(path.normalize(path.join(__dirname, "../../dist")))
);

app.use(
  "/src/client/assets/",
  express.static(path.normalize(path.join(__dirname, "../../assets"))) // TODO : search for better solution
);

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../../index.html"));
});

const server = http.createServer(app);
const gameServer = new Server({
  server,
  presence: new LocalPresence(),
});

const databaseManager = new DatabaseManager();

gameServer.listen(port, host, undefined, async () => {
  await databaseManager.connectDatabase();

  const timeDifference = Date.now();
  const gameStateDB = await databaseManager.backendHandler.getGameStateQuery();
  gameStateDB.timeDifference = Date.now() - timeDifference;

  const registrationPhaseRemainingTime =
    calculateRegistrationPhaseRemainingTime(gameStateDB);

  const isRegistrationPhase = registrationPhaseRemainingTime > 0;

  if (isRegistrationPhase) {
    setTimeout(() => {
      console.log("Registration phase finished");
      databaseManager.isRegistrationPhase = false;
    }, registrationPhaseRemainingTime);
  } else {
    databaseManager.isRegistrationPhase = false;
  }

  gameServer.define("game", Game, {
    db: databaseManager.backendHandler,
    gameStateDB,
  });
  matchMaker.createRoom("game", {
    db: databaseManager.backendHandler,
    gameStateDB,
  });

  gameServer.define("challenge", Challenge, {
    db: databaseManager.backendHandler,
  });

  app.post(
    "/createPlayer",
    databaseManager.frontendHandler.createPlayerAPI.bind(
      databaseManager.frontendHandler
    )
  );
  app.post(
    "/changeName",
    databaseManager.frontendHandler.changeNameAPI.bind(
      databaseManager.frontendHandler
    )
  );
  app.post(
    "/getPlayer",
    databaseManager.frontendHandler.getPlayerAPI.bind(
      databaseManager.frontendHandler
    )
  );
  app.get(
    "/getAllPlayers",
    databaseManager.frontendHandler.getAllPlayersAPI.bind(
      databaseManager.frontendHandler
    )
  );
  app.get(
    "/getGameState",
    databaseManager.frontendHandler.getGameStateAPI.bind(
      databaseManager.frontendHandler
    )
  );
  app.get(
    "/getChallenge",
    databaseManager.frontendHandler.getChallengeAPI.bind(
      databaseManager.frontendHandler
    )
  );
  app.get(
    "/getAllCollectedObjects",
    databaseManager.frontendHandler.getAllCollectedObjectsAPI.bind(
      databaseManager.frontendHandler
    )
  );
});

console.log(`Server is listening on localhost:${port}`);

// cron.schedule("*/2 * * * *", () => {  // ! it is handled in game room
//   // ? every 10 minutes

//   databaseManager.refreshDay().then(() => {});

//   // TODO :
//   /* send a message to every player in a game room OR
//      just fetch the database from the client-side
//      when remaining time to finish the daily challenge is 0
//   */
// });

// app.use("/colyseus", monitor());
