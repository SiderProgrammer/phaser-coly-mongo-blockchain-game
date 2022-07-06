const { Room } = require("colyseus");
const { ChallengeState } = require("../states/ChallengeState");

exports.default = class ChallengeRoom extends Room {
  onCreate() {
    console.log("Challenge room created");

    this.setState(new ChallengeState());

    this.setSimulationInterval(() => this.state.update());

    this.onMessage("*", (client, type, message) => {
      switch (type) {
        case "move":
          this.state.playerMove(message.dir);
          break;
      }
    });
  }

  onJoin(client, options) {
    console.log("New client joined to a challenge room");

    this.state.setWizardId(options.wizardId);
    this.state.setWizardOwner(options.address);

    this.lock(); // ? Lock the room for only one player
  }

  onLeave(client) {
    console.log("Client left a challenge room");
  }
};
