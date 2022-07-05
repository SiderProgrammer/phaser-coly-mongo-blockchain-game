const http = require("http");
const express = require("express");
const cors = require("cors");
const { Server, LocalPresence } = require("@colyseus/core");
const { monitor } = require("@colyseus/monitor");
const Game = require("./rooms/Game").default;
const Challenge = require("./rooms/Challenge").default;
const DatabaseManager = require("./db/databaseManager");

const port = Number(process.env.PORT || 8080);
const host = undefined;
const app = express();

app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const gameServer = new Server({
  server,
  presence: new LocalPresence(),
});

gameServer.define("game", Game);
gameServer.define("challenge", Challenge);
const databaseManager = new DatabaseManager();

//server.post();
app.post("/createPlayer", databaseManager.createPlayer);
app.post("/getPlayer", databaseManager.getPlayer);
app.get("/getAllPlayers", databaseManager.getAllPlayers);
// app.use("/colyseus", monitor());

gameServer.listen(port, host, undefined, () =>
  databaseManager.connectDatabase()
);
//server.listen(port, undefined, () => databaseManager.connectDatabase());
console.log(`Server is listening on localhost:${port}`);
