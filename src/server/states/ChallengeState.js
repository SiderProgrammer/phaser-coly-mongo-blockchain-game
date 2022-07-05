const schema = require("@colyseus/schema");
const { Wizard } = require("../entities/Wizard");
const DatabaseManager = require("../db/databaseManager");
const worldSize = { width: 800, height: 600 };
const obstacles = [{ x: 400, y: 300, size: 50 }];
const meta = { x: 400, y: 50, size: 50 };

const db = new DatabaseManager();

class State extends schema.Schema {
  constructor(sendMessage) {
    super();
    const PLAYER_SIZE = 50;
    this.wizard = new Wizard("0", 400, 500, PLAYER_SIZE, "test");
    this.challengeState = -1;
    this.owner = "";
    this.wizardId = "";
    this.sendMessage = sendMessage;
  }

  setWizardId(wizardId) {
    this.wizardId = wizardId;
  }

  setOwner(address) {
    this.owner = address;
  }

  playerMove(id, ts, dir) {
    const player = this.wizard;

    if (dir.x == 0 && dir.y == 0) dir.empty = true;

    if (!player || dir.empty) {
      return;
    }

    player.move(dir.x, dir.y, 5);
  }

  update() {
    if (!this.wizard) return;
    if (this.challengeState !== -1) return;

    obstacles.forEach((obstacle) => {
      if (this.isColliding(this.wizard, obstacle)) {
        this.challengeState = 0;
        db.killWizardRawMethod(this.owner, this.wizardId);
        console.log("wizard dead");
      }
    });

    if (this.isColliding(this.wizard, meta)) {
      this.challengeState = 1;
      console.log("wizard won");
    }
    // this.updateGame();
    // this.updatePlayers();
    // this.updateMonsters();
    // this.updateBullets();
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
