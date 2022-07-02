const { Room } = require("colyseus");
const { ChallengeState } = require("../states/ChallengeState");

exports.default = class ChallengeRoom extends Room {
  onCreate(options) {
    console.log("Challenge started");

    this.setState(new ChallengeState());

    this.setSimulationInterval(() => this.handleTick());

    //  Listen to messages from clients
    this.onMessage("*", (client, type, message) => {
      const playerId = client.sessionId;

      switch (type) {
        case "move":
          this.state.playerMove(playerId, message.ts, message.dir);
          break;
      }
    });
  }

  onJoin(client, options) {
    this.state.playerAdd(client.sessionId, options.playerName);
    console.log("New client started a challenge");
    //console.log(`${new Date().toISOString()} [Join] id=${client.sessionId} player=${options.playerName}`);
  }

  onLeave(client) {
    // this.state.playerRemove(client.sessionId);
    console.log("Client left a challenge");
    //  console.log(`${new Date().toISOString()} [Leave] id=${client.sessionId}`);
  }

  handleTick = () => {
    this.state.update();
  };
};
