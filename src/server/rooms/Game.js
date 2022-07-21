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

    this.autoDispose = false; // prevent from auto-closing the room when last client disconnected

    this.gameStateDB = await db.getGameStateQuery();

    //await this.setDaysHandler();
    const collectedObjects = await db.getAllCollectedObjectsQuery();
    const playersFromDB = await db.getAllPlayersQuery();
    this.setState(new GameState(playersFromDB, collectedObjects));

    this.state.wizardsCount = await db.countWizards();
    this.state.wizardsAliveCount = await db.countWizards({ isAlive: true });

    this.presence.subscribe("wizardDied", () => this.state.subtractAlive(1));

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

  async setDaysHandler() {
    // ! Just for now implementation
    // Maybe we can move part of this code to server node-cron
    // const remainingTime =
    //   Date.now() -
    //   this.gameStateDB.gameStartTimestamp +
    //   this.gameStateDB.dayDuration * this.gameStateDB.day;

    const dayCount =
      Math.floor(
        (Date.now() - this.gameStateDB.gameStartTimestamp) /
          this.gameStateDB.dayDuration
      ) + 1;

    if (dayCount !== this.gameStateDB.day) {
      await db.refreshDay(dayCount - this.gameStateDB.day);
      console.log("refreshing a day");
    }
    const remainingTime =
      this.gameStateDB.gameStartTimestamp +
      dayCount * this.gameStateDB.dayDuration -
      Date.now();

    function handleDayEnd() {
      db.refreshDay();
      this.state.killDelayedWizards();
      this.state.refreshWizardsChallenges();

      console.log("refreshing a day");
    }

    setTimeout(() => {
      handleDayEnd.call(this);

      setInterval(() => {
        handleDayEnd.call(this);
      }, this.gameStateDB.dayDuration);
    }, remainingTime);
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
