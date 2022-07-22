const { Player } = require("../entities/Player");
const { CollectableObject } = require("../entities/Object");
const schema = require("@colyseus/schema");
const DatabaseManager = require("../db/databaseManager");
const { TILE_SIZE } = require("../../shared/config");
const MapManager = require("../map/mapManager");
const MapGridManager = require("../../shared/mapGridManager");

const db = new DatabaseManager();

class State extends schema.Schema {
  constructor(playersFromDB, collectedObjects) {
    super();
    // this.daySlogan = ""
    this.playersFromDB = this.getPlayersFromDB(playersFromDB); // ? needed to prevent players overlapping
    this.players = new schema.MapSchema();
    this.wizardsAliveCount = 0;
    this.wizardsCount = 0;

    this.mapGridManager = new MapGridManager(this);
    this.worldGrid = this.mapGridManager.createWorldGrid();

    this.playersFromDB.forEach((player) =>
      this.mapGridManager.addWizardsToGrid(player.wizards)
    );

    this.mapManager = new MapManager(this);
    this.mapLayers = this.mapManager.getWorldMap();

    this.mapLayers.objects =
      this.getObjectsLayerCollectedRemoved(collectedObjects);

    this.mapGridManager.addLayersToGrid(this.mapLayers);

    this.objects = new schema.ArraySchema(); // ? needed to handle objects state

    this.mapLayers.objects.forEach((obj) => {
      this.objects.push(new CollectableObject(obj.r, obj.c)); // ? needed to handle objects state
    });

    //this.mapManager.addMapBoundaryToGrid();
  }

  getObjectsLayerCollectedRemoved(collectedObjects) {
    return this.mapLayers.objects.filter((obj) => {
      return !collectedObjects.some(
        (collectedObj) => collectedObj.c === obj.c && collectedObj.r === obj.r
      );
    });
  }

  getPlayersFromDB(playersFromDB) {
    const players = new Map();
    playersFromDB.forEach((player) => {
      players.set(player.address, player);
    });

    return players;
  }

  subtractAlive(count) {
    this.wizardsAliveCount -= count;
  }

  updateWizardsCounter(wizards) {
    const freshWizardsCount = db.countWizards();

    freshWizardsCount.then((count) => {
      const playerAliveWizardsCount = wizards.filter(
        (wizard) => wizard.isAlive
      ).length;

      if (count > this.wizardsCount) {
        // ? new player joined
        this.wizardsCount = count;
        this.wizardsAliveCount += playerAliveWizardsCount;
      }
    });
  }

  playerAdd(id, address) {
    const playerSavedState = db.getPlayerQuery(address);

    playerSavedState.then((state) => {
      console.log("Player added to a world room");

      const player = new Player(id, address);
      player.addWizards(state.wizards);
      this.players.set(id, player);

      // if (!this.playersFromDB.has(address)) {
      //   this.playersFromDB.set(address, state);
      // }

      this.mapGridManager.addWizardsToGrid(state.wizards);
      // console.log(this.worldGrid);
      this.updateWizardsCounter(state.wizards); // TODO : fix it
    });
  }

  playerRemove(id) {
    const player = this.players.get(id);
    db.savePlayerWizards(player.address, player.wizards);

    // if(!this.playersFromDB.get(player.address)) {
    //   this.playersFromDB.set(player.address, state);
    //   this.removeWizardsFromGrid(state.wizards)
    // }

    this.players.delete(id);
  }

  playerMove(id, dir) {
    const player = this.players.get(id);

    if (!player || !player.canMove(dir.x, dir.y, TILE_SIZE)) return;
    const selectedWizard = player.getSelectedWizard();
    // selectedWizard.reversePreMove = false;

    if (
      !this.mapGridManager.isTileWalkable(
        selectedWizard,
        dir.x,
        dir.y,
        TILE_SIZE
      )
    ) {
      // selectedWizard.reversePreMove = true;
      return;
    }

    if (
      this.mapGridManager.isWizardOnTile(selectedWizard.x, selectedWizard.y)
    ) {
      this.mapGridManager.setTileEmpty(selectedWizard.x, selectedWizard.y);
    }

    player.move(dir.x, dir.y, TILE_SIZE);

    if (this.mapGridManager.isTileFree(selectedWizard.x, selectedWizard.y)) {
      this.mapGridManager.addWizardToGrid(selectedWizard);
    }

    this.handleTile(player, selectedWizard.x, selectedWizard.y);

    if (this.mapGridManager.isTileObject(selectedWizard.x, selectedWizard.y)) {
      this.mapGridManager.addWizardToGrid(selectedWizard);
    }
  }

  handleTile(player, x, y) {
    const { r, c } = this.mapGridManager.getRowColumnFromCoords(x, y);
    const tile = this.worldGrid[r][c];
    if (tile === "let") {
      player.killSelectedWizard();
      this.subtractAlive(1);
      db.killWizard(player.address, player.getSelectedWizardId());
    } else if (tile === "obj") {
      db.increaseWizardObjectsCount(
        player.address,
        player.getSelectedWizardId()
      );
      db.setObjectCollected(r, c);
      player.getSelectedWizard().collectedObjectsCount++;

      const indexOfObject = this.objects.findIndex(
        (obj) => obj.c === c && obj.r === r
      );

      this.objects.splice(indexOfObject, 1);

      console.log("collected an obj");
    }
  }

  playerSelectWizard(id, wizardId) {
    const player = this.players.get(id);

    if (!player || !player.wizards[wizardId].isAlive) return; // TODO : test it

    player.selectWizard(wizardId);
  }

  killDelayedWizards() {
    let killedWizards = 0;
    this.players.forEach((player) => {
      player.wizards.forEach((wizard) => {
        if (!wizard.dailyChallengeCompleted) {
          wizard.isAlive = false;
          killedWizards;
        }
        // wizard.dailyChallengeCompleted = false;
      });
    });

    this.subtractAlive(killedWizards);
  }

  refreshWizardsChallenges() {
    this.players.forEach((player) => {
      player.wizards.forEach((wizard) => {
        wizard.dailyChallengeCompleted = false;
      });
    });
  }
}
schema.defineTypes(State, {
  players: { map: Player },
  wizardsAliveCount: "number",
  wizardsCount: "number",
  objects: [CollectableObject],
});

exports.GameState = State;
