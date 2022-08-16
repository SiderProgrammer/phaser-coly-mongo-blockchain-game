const { Room } = require("colyseus");
const {
  calculateRegistrationPhaseRemainingTime,
  calculateDayRemainingTime,
} = require("../../shared/utils");
const { GameState } = require("../states/GameState");

exports.default = class GameRoom extends Room {
  async onCreate({ db, gameStateDB }) {
    this.db = db;
    this.gameStateDB = gameStateDB;
    //   if (options.secret !== "MY-SECRET-VALUE") {
    //     throw new Error("unauthorized");
    // }
    // TODO : fix, sometimes 2 rooms are created instead of 1
    console.log("World room created");

    this.autoDispose = false; // prevent from auto-closing the room when last client disconnected
    const registrationPhaseRemainingTime =
      calculateRegistrationPhaseRemainingTime(gameStateDB);
    const isRegistrationPhase = registrationPhaseRemainingTime > 0;

    await this.setDaysHandler();

    const collectedObjects = await this.db.getAllCollectedObjectsQuery();
    const playersFromDB = await this.db.getAllPlayersQuery();
    this.setState(
      new GameState(db, playersFromDB, collectedObjects, this.gameStateDB)
    );

    this.state.wizardsCount = await this.db.countWizards();
    this.state.wizardsAliveCount = await this.db.countWizards({
      isAlive: true,
    });

    this.presence.subscribe("wizardDied", () => this.state.subtractAlive(1));

    if (isRegistrationPhase) {
      setTimeout(async () => {
        this.setActionHandler();
      }, registrationPhaseRemainingTime);
    } else {
      this.setActionHandler();
    }
  }

  setActionHandler() {
    this.onMessage("*", (client, type, message) => {
      const playerId = client.sessionId;

      switch (type) {
        case "move":
          this.state.playerMove(playerId, message.dir);
          break;
        case "select":
          this.state.playerSelectWizard(playerId, message.wizardId);
          break;
        case "nameChanged":
          this.state.wizardNameChanged(playerId, message.wizardId);
      }
    });
  }

  async setDaysHandler() {
    // ! implementation just for now
    // Maybe we can move part of this code to server node-cron, we'll see later
    const dayCount =
      Math.floor(
        (Date.now() - this.gameStateDB.gameStartTimestamp) /
          this.gameStateDB.dayDuration
      ) + 1;

    if (dayCount !== this.gameStateDB.day) {
      await this.db.refreshDay(dayCount - this.gameStateDB.day);
      this.gameStateDB.day = dayCount;
      this.refreshDay(dayCount);
    }

    function handleDayEnd() {
      this.db.refreshDay().then(() => {
        this.refreshDay(this.state.day + 1);
      });
    }

    const remainingTime = calculateDayRemainingTime(this.gameStateDB);
    // this.clock.setTimeout, see colyseus server timing-events
    // https://docs.colyseus.io/colyseus/server/timing-events/
    setTimeout(() => {
      handleDayEnd.call(this);

      setInterval(() => {
        handleDayEnd.call(this);
      }, this.gameStateDB.dayDuration);
    }, remainingTime);
  }

  refreshDay(day = 1) {
    console.log("day refresh");

    this.db.getDayQuery(day).then((dayData) => {
      this.state.killDelayedWizards();
      this.state.refreshWizardsChallenges();

      this.db
        .countWizards({
          isAlive: true,
        })
        .then((count) => {
          this.state.wizardsAliveCount = count;
        });

      this.state.day++;
      this.state.slogan = dayData.slogan;
    });
  }

  onJoin(client, options) {
    // TODO : prevent to join players who are not in database
    this.state.playerAdd(client.sessionId, options.address);
    console.log("New client joined to a world room");
  }

  onLeave(client, c) {
    this.state.playerRemove(client.sessionId);
    console.log("Client left a world room");
  }
};
