const { Room } = require("colyseus");
const { ChallengeState } = require("../states/ChallengeState");

exports.default = class ChallengeRoom extends Room {
  onCreate(options) {
    console.log("Challenge started");
    this.presence.publish("test", { yo: "DFASDA" });
    this.setState(new ChallengeState(this.handleMessage));

    this.setSimulationInterval(() => this.handleTick());

    //  Listen to messages from clients
    this.onMessage("*", (client, type, message) => {
      const playerId = client.sessionId;

      switch (type) {
        case "move":
          this.state.playerMove(playerId, message.ts, message.dir);
          break;
        case "leave-challenge":
          client.send("change-room", { roomName: "challenge" });
          break;
      }
    });
  }

  onJoin(client, options) {
    //this.state.playerAdd(client.sessionId, options.playerName);
    console.log("New client started a challenge");
    this.lock();
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

  handleMessage = (message) => {
    console.log("New message sent!");
    this.broadcast(message.type, message);
  };
};
