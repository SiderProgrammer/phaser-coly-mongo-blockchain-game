const { Player } = require("../entities/Player");
const schema = require("@colyseus/schema");
const DatabaseManager = require("../db/databaseManager");

const db = new DatabaseManager();

const PLAYER_SPEED = 32;

class State extends schema.Schema {
  constructor() {
    super();
    this.players = new schema.MapSchema();
  }
  playerAdd(id, address) {
    const playerSavedState = db.getPlayerQuery(address);

    playerSavedState.then((state) => {
      console.log("Player added to a world room");

      const player = new Player(id, address);
      player.addWizards(state.wizards);
      this.players.set(id, player);
    });
  }

  playerRemove(id) {
    const player = this.players.get(id);
    db.savePlayerWizards(player.address, player.wizards);

    this.players.delete(id);
  }

  playerMove(id, dir) {
    const player = this.players.get(id);
    if (!player) return;

    player.move(dir.x, dir.y, PLAYER_SPEED);
  }

  playerSelectWizard(id, wizardId) {
    const player = this.players.get(id);

    if (!player || !player.wizards[wizardId].isAlive) return; // TODO : test it

    player.selectWizard(wizardId);
  }
}
schema.defineTypes(State, {
  players: { map: Player },
});

exports.GameState = State;
