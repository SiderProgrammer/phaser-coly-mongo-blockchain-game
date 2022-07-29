const schema = require("@colyseus/schema");
const { Wizard } = require("../entities/Wizard");
const DatabaseManager = require("../db/databaseManager");
const {
  CHALLENGE_PLAYER,
  CHALLENGE_OBSTACLES,
  CHALLENGE_META,
  PLAYER_SIZE,
  TILE_SIZE,
} = require("../../shared/config");

const db = new DatabaseManager();

class State extends schema.Schema {
  constructor(presenceEmit, challengeData) {
    super();

    this.lethals = challengeData.lethals;
    this.meta = challengeData.meta;
    this.startPosition = challengeData.startPosition;

    this.meta.size = CHALLENGE_META.size;
    this.lethals.forEach(
      (lethal) => (lethal.size = CHALLENGE_OBSTACLES[0].size)
    );

    this.wizard = new Wizard(
      "0", // can be removed I suppose
      {
        x: this.startPosition.x,
        y: this.startPosition.y,
      }
    );

    this.challengeData = challengeData;
    this.presenceEmit = presenceEmit;

    this.challengeState = -1;
    this.owner = "";
    this.wizardId = "";
  }

  setWizardId(wizardId) {
    this.wizardId = wizardId;
  }

  setWizardOwner(address) {
    this.owner = address;
  }

  playerMove(dir) {
    if (!this.wizard) return;

    this.wizard.move(dir.x, dir.y, TILE_SIZE);
  }

  update() {
    if (!this.wizard || this.challengeState !== -1) return;

    this.checkObstaclesCollision();
    this.checkMetaCollision();
  }

  checkObstaclesCollision() {
    this.lethals.forEach((lethal) => {
      if (this.isColliding(this.wizard, lethal)) {
        this.challengeState = 0;
        db.killWizard(this.owner, this.wizardId);
        this.presenceEmit("wizardDied");
        console.log("Lost a challenge");
      }
    });
  }

  checkMetaCollision() {
    if (this.isColliding(this.wizard, this.meta)) {
      db.setCompletedDailyChallenge(this.owner, this.wizardId);
      this.challengeState = 1;

      console.log("Won a challenge");
    }
  }

  isColliding(bodyA, bodyB) {
    return (
      bodyA.x < bodyB.x + bodyB.size &&
      bodyA.x + bodyA.size > bodyB.x &&
      bodyA.y < bodyB.y + bodyB.size &&
      bodyA.size + bodyA.y > bodyB.y
    );
  }
}
schema.defineTypes(State, {
  wizard: Wizard,
  challengeState: "number",
});

exports.ChallengeState = State;
