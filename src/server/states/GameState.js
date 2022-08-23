const { Player } = require("../entities/Player");
const { CollectableObject } = require("../entities/Object");
const schema = require("@colyseus/schema");

const {
  TILE_SIZE,
  WORLD_ROWS_COUNT,
  WORLD_COLUMNS_COUNT,
  DAILY_MAX_MOVES,
} = require("../../shared/config");
const MapManager = require("../../shared/mapManager");
const MapGridManager = require("../../shared/mapGridManager");
const worldMap = require("../maps/world/sampleMap");
const { randomInRange } = require("../../shared/utils");

class State extends schema.Schema {
  constructor(db, playersFromDB, collectedObjects, gameState) {
    super();
    this.db = db;
    this.day = gameState.day;
    this.daySlogan = gameState.slogan;

    this.playersFromDB = this.getPlayersFromDB(playersFromDB);
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

  updateWizardsCounter(address, wizards) {
    if (!this.playersFromDB.has(address)) {
      const playerAliveWizardsCount = wizards.filter(
        (wizard) => wizard.isAlive
      ).length;

      this.wizardsCount += wizards.length;
      this.wizardsAliveCount += playerAliveWizardsCount;
    }
  }

  wizardNameChanged(id, wizardId) {
    const player = this.players.get(id);
    const newName = this.db.getPlayerWizardName(player.address, wizardId);

    newName.then((name) => {
      player.wizards[wizardId].name = name;
    });
  }

  playerAdd(id, address) {
    const playerSavedState = this.db.getPlayerQuery(address);

    playerSavedState.then((state) => {
      console.log("Player added to a world room");

      const player = new Player(id, address);
      player.addWizards(state.wizards);
      this.players.set(id, player);

      this.mapGridManager.addWizardsToGrid(state.wizards);

      this.updateWizardsCounter(address, state.wizards); //the order matters
      this.playersFromDB.set(address, state); //the order matters
    });
  }

  playerRemove(id) {
    const player = this.players.get(id);
    this.mapGridManager.removeWizardsFromGrid(player.wizards);
    this.db.savePlayerWizards(player.address, player.wizards);
    this.players.delete(id);
  }

  playerMove(id, dir) {
    const player = this.players.get(id);

    if (!player || !player.canMove()) return;
    const selectedWizard = player.getSelectedWizard();

    if (!this.mapGridManager.isTileWalkable(selectedWizard, dir.x, dir.y)) {
      return;
    }

    if (
      this.mapGridManager.isWizardOnTile(selectedWizard.r, selectedWizard.c)
    ) {
      this.mapGridManager.setTileEmpty(selectedWizard.r, selectedWizard.c);
    }

    player.move(dir.x, dir.y);

    if (this.mapGridManager.isTileFree(selectedWizard.r, selectedWizard.c)) {
      this.mapGridManager.addWizardToGrid(selectedWizard);
    }

    this.handleTile(player, selectedWizard.r, selectedWizard.c);

    if (this.mapGridManager.isTileObject(selectedWizard.r, selectedWizard.c)) {
      this.mapGridManager.addWizardToGrid(selectedWizard);
    }
  }

  handleTile(player, r, c) {
    const tile = this.worldGrid[r][c];

    if (tile === "let") {
      player.killSelectedWizard();
      this.subtractAlive(1);
      this.db.killWizard(player.address, player.getSelectedWizardId());
    } else if (tile.includes("obj")) {
      const objectType = tile[tile.length - 1]; // 1 / 2 / 3

      this.db.increaseWizardObjectsCount(
        // TODO : move it to playerRemove method
        player.address,
        player.getSelectedWizardId(),
        objectType
      );
      this.db.setObjectCollected(r, c, objectType);

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

  refreshDay() {
    this.players.forEach((player) => {
      player.wizards.forEach((wizard) => {
        if (!wizard.dailyChallengeCompleted && wizard.isAlive) {
          wizard.isAlive = false;
        }

        wizard.dailyChallengeCompleted = false;
        wizard.movesLeft = DAILY_MAX_MOVES;
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
