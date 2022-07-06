const { Player } = require("../entities/Player");
const schema = require("@colyseus/schema");
const DatabaseManager = require("../db/databaseManager");

const db = new DatabaseManager();

class State extends schema.Schema {
  constructor(sendMessage) {
    super();
    this.players = new schema.MapSchema();
    this.sendMessage = sendMessage;
  }
  playerAdd(id, address) {
    const PLAYER_SIZE = 50;

    const playerSavedState = db.getPlayerRawMethod(address);

    playerSavedState.then((state) => {
      const player = new Player(id, address);
      player.addWizards(state.wizards);
      this.players.set(id, player);
    });
  }

  playerRemove(id) {
    this.players.delete(id);
  }

  playerMove(id, ts, dir) {
    const player = this.players.get(id);

    if (dir.x == 0 && dir.y == 0) dir.empty = true;

    if (!player || dir.empty) {
      return;
    }

    player.move(dir.x, dir.y, 5);
  }

  playerSelectWizard(id, ts, wizardId) {
    const player = this.players.get(id);
    player.selectWizard(wizardId);
  }

  playChallenge(id, ts, wizardId) {
    // const player = this.players.get(id);
    // const wizard = player.getWizardById(wizardId);
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
}
schema.defineTypes(State, {
  players: { map: Player },
});

exports.GameState = State;
