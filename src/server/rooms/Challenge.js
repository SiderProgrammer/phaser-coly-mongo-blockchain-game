const { Room } = require("colyseus");
const { ChallengeState } = require("../states/ChallengeState");
const DatabaseManager = require("../db/databaseManager");

const db = new DatabaseManager();
exports.default = class ChallengeRoom extends Room {
  async onCreate() {
    //   if (options.secret !== "MY-SECRET-VALUE") {
    //     throw new Error("unauthorized");
    // }
    console.log("Challenge room created");

    const challengeData = await db.getChallengeQuery();
    this.setState(
      new ChallengeState(this.presenceEmit.bind(this), challengeData)
    );

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

    this.lock(); // ? Lock the room for only one player

    db.canWizardPlayChallenge(options.address, options.wizardId).then(
      (canPlay) => {
        if (canPlay) {
          this.state.setWizardId(options.wizardId);
          this.state.setWizardOwner(options.address);
        } else {
          // leave the cheater :D
          console.log("leave");
          this.disconnect();
        }
      }
    );
  }

  presenceEmit(type) {
    this.presence.publish(type);
  }
};
