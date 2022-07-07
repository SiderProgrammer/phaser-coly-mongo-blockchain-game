const http = require("http");
const express = require("express");
const cors = require("cors");
const { Server, LocalPresence } = require("@colyseus/core");
const Game = require("./rooms/Game").default;
const Challenge = require("./rooms/Challenge").default;
const DatabaseManager = require("./db/databaseManager");
const { SERVER_PORT } = require("../shared/config");
const path = require("path");

const port = process.env.PORT || SERVER_PORT;
const host = "0.0.0.0";
const app = express();
// const __dirname = dirname(__filename);

app.use(cors());
app.use(express.json());

app.use("/", express.static(path.join(__dirname, "../../dist")));

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
