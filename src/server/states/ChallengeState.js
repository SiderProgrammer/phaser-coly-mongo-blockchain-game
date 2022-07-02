const schema = require("@colyseus/schema");
const { Wizard } = require("../entities/Wizard");

const worldSize = { width: 800, height: 600 };
const obstacles = [{ x: 400, y: 200, size: 50 }];

class State extends schema.Schema {
  constructor(sendMessage) {
    super();
    this.wizard = null;
    this.sendMessage = sendMessage;
  }
  playerAdd(id, name) {
    const PLAYER_SIZE = 50;

    this.wizard = new Wizard(id, 400, 200, PLAYER_SIZE, name);

    // // Broadcast message to other players
    // this.sendMessage({
    //   type: "joined",
    //   from: "server",
    //   ts: Date.now(),
    //   params: {
    //     playerName: this.players.get(id).name,
    //   },
    // });
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
    // this.players.forEach((player, playerId) => {
    //   obstacles.forEach((obstacle) => {
    //     if (this.isColliding(player, obstacle)) {
    //       console.log("collision!");
    //     }
    //   });
    // });
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
  player: Wizard,
});

exports.ChallengeState = State;
