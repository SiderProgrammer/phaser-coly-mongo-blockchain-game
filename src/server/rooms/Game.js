const { Room } = require("colyseus");
const { GameState } = require("../states/GameState");

exports.default = class GameRoom extends Room {
  onCreate() {
    console.log("World room created");

    this.setState(new GameState());

    //this.setSimulationInterval(() => this.state.update());

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
