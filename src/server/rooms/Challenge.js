const { Room } = require("colyseus");
const { ChallengeState } = require("../states/ChallengeState");

exports.default = class ChallengeRoom extends Room {
  onCreate() {
    //   if (options.secret !== "MY-SECRET-VALUE" || !hasAliveWizards) {
    //     throw new Error("unauthorized");
    // }
    console.log("Challenge room created");

    this.setState(new ChallengeState(this.presenceEmit.bind(this)));

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
    // TODO : check if wizard is alive
    this.state.setWizardId(options.wizardId);
    this.state.setWizardOwner(options.address);

    this.lock(); // ? Lock the room for only one player
  }

  presenceEmit(type) {
    this.presence.publish(type);
  }
};
