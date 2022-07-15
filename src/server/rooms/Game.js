const { Room } = require("colyseus");
const { GameState } = require("../states/GameState");
const DatabaseManager = require("../db/databaseManager");

const db = new DatabaseManager();
exports.default = class GameRoom extends Room {
  async onCreate() {
    //   if (options.secret !== "MY-SECRET-VALUE") {
    //     throw new Error("unauthorized");
    // }
    console.log("World room created");

    this.gameStateDB = await db.getGameStateQuery();
    let remainingTime =
      Date.now() -
      this.gameStateDB.gameStartTimestamp +
      this.gameStateDB.dayDuration * this.gameStateDB.day;

    function handleDayEnd() {
      db.refreshDay();
      this.state.killDelayedWizards();
      this.state.refreshWizardsChallenges();
      remainingTime = this.gameStateDB.dayDuration;

      console.log("refreshing a day");

      setTimeout(() => {
        handleDayEnd.call(this);
      }, remainingTime);
    }

    setTimeout(() => {
      handleDayEnd.call(this);
    }, remainingTime);

    this.setState(new GameState());

    this.state.wizardsCount = await db.countWizards();
    this.state.wizardsAliveCount = await db.countWizards({ isAlive: true });

    this.presence.subscribe("wizardDied", () => this.state.subtractAlive(1));

    this.autoDispose = false; // prevent from auto-closing the room

    this.onMessage("*", (client, type, message) => {
      const playerId = client.sessionId;

      switch (type) {
        case "move":
          this.state.playerMove(playerId, message.dir);
          break;
        case "select":
          this.state.playerSelectWizard(playerId, message.wizardId);
          break;
      }
    });
  }

  onJoin(client, options) {
    this.state.playerAdd(client.sessionId, options.address);
    console.log("New client joined to a world room");
  }

  onLeave(client, c) {
    this.state.playerRemove(client.sessionId);
    console.log("Client left a world room");
  }
};
