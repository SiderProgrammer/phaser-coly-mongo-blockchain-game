const { Player } = require("../entities/Player");
const schema = require("@colyseus/schema");
const DatabaseManager = require("../db/databaseManager");
const { TILE_SIZE } = require("../../shared/config");

const db = new DatabaseManager();

class State extends schema.Schema {
  constructor() {
    super();
    this.players = new schema.MapSchema();
    this.wizardsAliveCount = 0;
    this.wizardsCount = 0;
  }

  subtractAlive(count) {
    this.wizardsAliveCount -= count;
  }

  playerAdd(id, address) {
    const playerSavedState = db.getPlayerQuery(address);

    playerSavedState.then((state) => {
      console.log("Player added to a world room");

      const player = new Player(id, address);
      player.addWizards(state.wizards);
      this.players.set(id, player);

      const freshWizardsCount = db.countWizards();

      freshWizardsCount.then((count) => {
        const playerAliveWizardsCount = state.wizards.filter(
          (wizard) => wizard.isAlive
        ).length;

        if (count > this.wizardsCount) {
          // ? new player joined
          this.wizardsCount = count;
          this.wizardsAliveCount += playerAliveWizardsCount;
        }
      });
    });
  }

  playerRemove(id) {
    const player = this.players.get(id);
    db.savePlayerWizards(player.address, player.wizards);

    this.players.delete(id);
  }

  playerMove(id, dir) {
    const player = this.players.get(id);
    if (!player || !player.canMove(dir.x, dir.y, TILE_SIZE)) return;

    player.move(dir.x, dir.y, TILE_SIZE);
  }

  playerSelectWizard(id, wizardId) {
    const player = this.players.get(id);

    if (!player || !player.wizards[wizardId].isAlive) return; // TODO : test it

    player.selectWizard(wizardId);
  }

  killDelayedWizards() {
    this.players.forEach((player) => {
      player.wizards.forEach((wizard) => {
        if (!wizard.dailyChallengeCompleted) {
          wizard.isAlive = false;
        }
        // wizard.dailyChallengeCompleted = false;
      });
    });
  }

  refreshWizardsChallenges() {
    // this.players.forEach(player => {
    //   player.wizards.forEach(wizard => {
    //     wizard.dailyChallengeCompleted = false;
    //   })
    // })
  }
}
schema.defineTypes(State, {
  players: { map: Player },
  wizardsAliveCount: "number",
  wizardsCount: "number",
});

exports.GameState = State;
