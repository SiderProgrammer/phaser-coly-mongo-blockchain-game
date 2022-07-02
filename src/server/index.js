const http = require("http");
const express = require("express");
const cors = require("cors");
const { Server } = require("@colyseus/core");
const { monitor } = require("@colyseus/monitor");
const Game = require("./rooms/Game").default;
const Challenge = require("./rooms/Challenge").default;

const port = Number(process.env.PORT || 8080);
const app = express();

app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const gameServer = new Server({
  server,
});

gameServer.define("game", Game);
gameServer.define("challenge", Challenge);

// app.use("/colyseus", monitor());

gameServer.listen(port);
console.log(`Server is listening on ws://localhost:${port}`);
