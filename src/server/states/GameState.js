const { Player } = require("../entities/Player");
const schema = require("@colyseus/schema");

const worldSize = { width: 800, height: 600 };
const obstacles = [{ x: 400, y: 200, size: 50 }];

class State extends schema.Schema {
  constructor(sendMessage) {
    super();
    this.players = new schema.MapSchema();
    this.sendMessage = sendMessage;
  }
  playerAdd(id, name) {
    const spawner = { x: Math.random() * 400, y: 350 };
    const PLAYER_SIZE = 50;

    const player = new Player(
      id,
      spawner.x + PLAYER_SIZE,
      spawner.y + PLAYER_SIZE,
      PLAYER_SIZE,
      name
    );

    // // Add the user to the "red" team by default
    // if (this.game.mode === 'team deathmatch') {
    //     player.setTeam('Red');
    // }

    this.players.set(id, player);

    // Broadcast message to other players
    this.sendMessage({
      type: "joined",
      from: "server",
      ts: Date.now(),
      params: {
        playerName: this.players.get(id).name,
      },
    });
  }

  playerMove(id, ts, dir) {
    const player = this.players.get(id);

    if (dir.x == 0 && dir.y == 0) dir.empty = true;

    if (!player || dir.empty) {
      return;
    }

    player.move(dir.x, dir.y, 5);
  }

  update() {
    this.players.forEach((player, playerId) => {
      obstacles.forEach((obstacle) => {
        if (this.isColliding(player, obstacle)) {
          console.log("collision!");
        }
      });
    });
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
  players: { map: Player },
});

exports.GameState = State;
