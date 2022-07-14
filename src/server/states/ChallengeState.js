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

const obstacles = CHALLENGE_OBSTACLES;
const meta = CHALLENGE_META;

const db = new DatabaseManager();

class State extends schema.Schema {
  constructor(presenceEmit) {
    super();

    this.wizard = new Wizard(
      "0", // not needed in this room
      CHALLENGE_PLAYER.x,
      CHALLENGE_PLAYER.y,
      PLAYER_SIZE,
      "" // not needed in this room
    );

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
    obstacles.forEach((obstacle) => {
      if (this.isColliding(this.wizard, obstacle)) {
        this.challengeState = 0;
        db.killWizard(this.owner, this.wizardId);
        this.presenceEmit("wizardDied");
        console.log("Lost a challenge");
      }
    });
  }

  checkMetaCollision() {
    if (this.isColliding(this.wizard, meta)) {
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
