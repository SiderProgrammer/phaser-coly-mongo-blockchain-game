const { Room } = require("colyseus");
const { ChallengeState } = require("../states/ChallengeState");

exports.default = class ChallengeRoom extends Room {
  async onCreate({ db }) {
    this.db = db;
    //   if (options.secret !== "MY-SECRET-VALUE") {
    //     throw new Error("unauthorized");
    // }
    console.log("Challenge room created");

    const challengeData = await this.db.getChallengeQuery();
    this.setState(
      new ChallengeState(this.db, this.presenceEmit.bind(this), challengeData)
    );
  }

  onJoin(client, options) {
    console.log("New client joined to a challenge room");

    this.lock(); // ? Lock the room for only one player

    this.db
      .canWizardPlayChallenge(options.address, options.wizardId)
      .then((canPlay) => {
        if (canPlay) {
          this.state.setWizardId(options.wizardId);
          this.state.setWizardOwner(options.address);
          this.setActionHandler();
          this.state.isChallengeStarted = true;
        } else {
          // leave the cheater :D
          console.log("leave the cheater");
          this.disconnect();
        }
      });
  }
  setActionHandler() {
    this.onMessage("*", (client, type, message) => {
      switch (type) {
        case "move":
          this.state.playerMove(message.dir);
          break;
      }
    });
  }

  presenceEmit(type) {
    this.presence.publish(type);
  }
};
