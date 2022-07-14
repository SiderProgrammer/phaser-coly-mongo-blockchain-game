const http = require("http");
const express = require("express");
const cors = require("cors");
const { Server, LocalPresence } = require("@colyseus/core");
const Game = require("./rooms/Game").default;
const Challenge = require("./rooms/Challenge").default;
const DatabaseManager = require("./db/databaseManager");
const { SERVER_PORT } = require("../shared/config");
const path = require("path");
const cron = require("node-cron");
const MapManager = require("./map/mapManager");

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

gameServer.define("game", Game);
gameServer.define("challenge", Challenge);

const databaseManager = new DatabaseManager();
const mapManager = new MapManager();

// cron.schedule("*/2 * * * *", () => {
//   // ? every 10 minutes

//   databaseManager.refreshDay().then(() => {});

//   // TODO :
//   /* send a message to every player in a game room OR
//      just fetch the database from the client-side
//      when remaining time to finish the daily challenge is 0
//   */
// });

app.post("/createPlayer", databaseManager.createPlayer);
app.post("/getPlayer", databaseManager.getPlayer);
app.get("/getAllPlayers", databaseManager.getAllPlayers);
app.get("/getGameState", databaseManager.getGameState);

app.get("/getWorldMap", mapManager.getWorldMap);
// app.use("/colyseus", monitor());

gameServer.listen(port, host, undefined, () =>
  databaseManager.connectDatabase()
);
//server.listen(port, undefined, () => databaseManager.connectDatabase());
console.log(`Server is listening on localhost:${port}`);
