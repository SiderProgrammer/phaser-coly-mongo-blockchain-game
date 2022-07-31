const { Player } = require("../entities/Player");
const { CollectableObject } = require("../entities/Object");
const schema = require("@colyseus/schema");
const DatabaseManager = require("../db/databaseManager");
const { TILE_SIZE } = require("../../shared/config");
const MapManager = require("../../shared/mapManager");
const MapGridManager = require("../../shared/mapGridManager");
const worldMap = require("../maps/world/sampleMap");
const db = new DatabaseManager();

class State extends schema.Schema {
  constructor(playersFromDB, collectedObjects, gameState) {
    super();
    this.day = gameState.day;
    this.daySlogan = gameState.slogan;

    this.playersFromDB = this.getPlayersFromDB(playersFromDB); // ? needed to prevent players overlapping
    this.players = new schema.MapSchema();
    this.wizardsAliveCount = 0;
    this.wizardsCount = 0;

    this.mapGridManager = new MapGridManager(this);
    this.worldGrid = this.mapGridManager.createWorldGrid();

    this.playersFromDB.forEach((player) =>
      this.mapGridManager.addWizardsToGrid(player.wizards)
    );

    this.mapManager = new MapManager(this, worldMap);
    this.mapLayers = this.mapManager.getWorldMap();
    this.mapManager.removeCollectedObjects(collectedObjects);
    this.mapGridManager.addLayersToGrid(this.mapLayers);

    this.objects = new schema.ArraySchema();

    this.mapLayers.objects.forEach((obj) => {
      this.objects.push(new CollectableObject(obj.r, obj.c, "1"));
    });
    this.mapLayers.objects2.forEach((obj) => {
      this.objects.push(new CollectableObject(obj.r, obj.c, "2"));
    });
    this.mapLayers.objects3.forEach((obj) => {
      this.objects.push(new CollectableObject(obj.r, obj.c, "3"));
    });
    //this.mapManager.addMapBoundaryToGrid();
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

  wizardNameChanged(id, wizardId) {
    const player = this.players.get(id);
    const newName = db.getPlayerWizardName(player.address, wizardId);

    newName.then((name) => {
      player.wizards[wizardId].name = name;
    });
  }

  playerAdd(id, address) {
    const playerSavedState = db.getPlayerQuery(address);

    playerSavedState.then((state) => {
      console.log("Player added to a world room");

      const player = new Player(id, address);
      player.addWizards(state.wizards);
      this.players.set(id, player);

      this.mapGridManager.addWizardsToGrid(state.wizards);

      this.updateWizardsCounter(state.wizards); // TODO : fix it
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
    const selectedWizard = player.getSelectedWizard();

    if (
      !this.mapGridManager.isTileWalkable(
        selectedWizard,
        dir.x,
        dir.y,
        TILE_SIZE
      )
    ) {
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
    } else if (tile.includes("obj")) {
      const objectType = tile[tile.length - 1]; // 1 / 2 / 3

      db.increaseWizardObjectsCount(
        player.address,
        player.getSelectedWizardId(),
        objectType
      );
      db.setObjectCollected(r, c, objectType);

      player.getSelectedWizard().increaseCollectedObjects(objectType);

      const indexOfObject = this.objects.findIndex(
        (obj) => obj.c === c && obj.r === r
      );

      this.objects.splice(indexOfObject, 1);

      console.log("collected an obj with type:", objectType);
    }
  }

  playerSelectWizard(id, wizardId) {
    const player = this.players.get(id);

    if (!player || !player.wizards[wizardId].isAlive) return;

    player.selectWizard(wizardId);
  }

  killDelayedWizards() {
    let killedWizards = 0;

    this.players.forEach((player) => {
      player.wizards.forEach((wizard) => {
        if (!wizard.dailyChallengeCompleted && wizard.isAlive) {
          wizard.isAlive = false;
          killedWizards++;
        }
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
  day: "number",
  slogan: "string",
  players: { map: Player },
  wizardsAliveCount: "number",
  wizardsCount: "number",
  objects: [CollectableObject],
});

exports.GameState = State;
