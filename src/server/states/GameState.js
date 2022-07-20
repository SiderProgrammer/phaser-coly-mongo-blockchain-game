const { Player } = require("../entities/Player");
const { CollectableObject } = require("../entities/Object");
const schema = require("@colyseus/schema");
const DatabaseManager = require("../db/databaseManager");
const {
  TILE_SIZE,
  WORLD_ROWS_COUNT,
  WORLD_COLUMNS_COUNT,
} = require("../../shared/config");
const MapManager = require("../map/mapManager");

const db = new DatabaseManager();

class State extends schema.Schema {
  constructor(playersFromDB, collectedObjects) {
    super();
    // this.daySlogan = ""
    this.playersFromDB = this.getMapPlayersFromDB(playersFromDB); // ? needed to prevent players overlapping
    this.players = new schema.MapSchema();
    this.wizardsAliveCount = 0;
    this.wizardsCount = 0;
    this.worldGrid = this.createWorldGrid();

    this.playersFromDB.forEach((player) =>
      this.addWizardsToGrid(player.wizards)
    );

    this.mapManager = new MapManager();
    this.mapLayers = this.mapManager.getWorldMap();

    this.mapLayers.objects = this.mapLayers.objects.filter((obj) => {
      return !collectedObjects.some(
        (collectedObj) => collectedObj.c === obj.c && collectedObj.r === obj.r
      );
    });

    this.addLayersToGrid(this.mapLayers);

    this.objects = new schema.ArraySchema();

    this.mapLayers.objects.forEach((obj) => {
      this.objects.push(new CollectableObject(obj.r, obj.c));
    });

    //this.addMapBoundaryToGrid();
  }
  addMapBoundaryToGrid() {
    for (let c = 0; c < WORLD_COLUMNS_COUNT; c++) {
      this.worldGrid[0][c] = "bon";
    }
    for (let c = 0; c < WORLD_COLUMNS_COUNT; c++) {
      this.worldGrid[WORLD_ROWS_COUNT - 1][c] = "bon";
    }

    for (let r = 0; r < WORLD_ROWS_COUNT; r++) {
      this.worldGrid[0][r] = "bon";
    }

    for (let r = 0; r < WORLD_ROWS_COUNT; r++) {
      this.worldGrid[WORLD_COLUMNS_COUNT - 1][r] = "bon";
    }
  }

  getMapPlayersFromDB(playersFromDB) {
    const players = new Map();
    playersFromDB.forEach((player) => {
      players.set(player.address, player);
    });

    return players;
  }

  createWorldGrid() {
    const grid = [];
    for (let r = 0; r < WORLD_ROWS_COUNT; r++) {
      grid[r] = new Array(WORLD_COLUMNS_COUNT).fill("");
    }
    return grid;
  }

  addLayersToGrid(layers) {
    for (const layer in layers) {
      layers[layer].forEach((tile) => {
        this.worldGrid[tile.r][tile.c] = layer.slice(0, 3);
      });
    }
  }
  addWizardsToGrid(wizards) {
    const wizardsGridPos = wizards.map((wizard) =>
      this.getRowColumnFromCoords(wizard.x, wizard.y)
    );

    wizardsGridPos.forEach((pos) => {
      this.worldGrid[pos.r][pos.c] = "wiz";
    });
  }

  setTileEmpty(x, y) {
    const { r, c } = this.getRowColumnFromCoords(x, y);
    this.worldGrid[r][c] = "";
  }

  addWizardToGrid(wizard) {
    const { r, c } = this.getRowColumnFromCoords(wizard.x, wizard.y);
    this.worldGrid[r][c] = "wiz";
  }

  getRowColumnFromCoords(x, y) {
    return {
      r: Math.floor(y / TILE_SIZE),
      c: Math.floor(x / TILE_SIZE),
    };
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

      this.addWizardsToGrid(state.wizards);
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
    // TODO: remove reversePreMove property and generate world grid on client-side
    const selectedWizard = player.getSelectedWizard();
    selectedWizard.reversePreMove = false;

    if (!this.isTileWalkable(selectedWizard, dir.x, dir.y, TILE_SIZE)) {
      selectedWizard.reversePreMove = true;
      return;
    }

    if (this.isWizardOnTile(selectedWizard.x, selectedWizard.y)) {
      this.setTileEmpty(selectedWizard.x, selectedWizard.y);
    }

    player.move(dir.x, dir.y, TILE_SIZE);

    if (this.isTileFree(selectedWizard.x, selectedWizard.y)) {
      this.addWizardToGrid(selectedWizard);
    }

    this.handleTile(player, selectedWizard.x, selectedWizard.y);

    if (this.isTileObject(selectedWizard.x, selectedWizard.y)) {
      this.addWizardToGrid(selectedWizard);
    }
  }

  handleTile(player, x, y) {
    const { r, c } = this.getRowColumnFromCoords(x, y);
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
  isWizardOnTile(x, y) {
    const { r, c } = this.getRowColumnFromCoords(x, y);

    return this.worldGrid[r][c] === "wiz";
  }
  isTileFree(x, y) {
    const { r, c } = this.getRowColumnFromCoords(x, y);

    return this.worldGrid[r][c] === "";
  }
  isTileObject(x, y) {
    const { r, c } = this.getRowColumnFromCoords(x, y);

    return this.worldGrid[r][c] === "obj";
  }
  isTileWalkable(wizard, dirX, dirY, speed) {
    const speedX = speed * dirX;
    const speedY = speed * dirY;

    const { r, c } = this.getRowColumnFromCoords(
      wizard.x + speedX,
      wizard.y + speedY
    );

    const isTileOutOfBounds = this.isTileOutOfBounds(r, c);
    if (isTileOutOfBounds) return false;

    const tile = this.worldGrid[r][c];

    return tile === "" || tile === "let" || tile === "obj";
  }

  isTileOutOfBounds(r, c) {
    return !(
      this.worldGrid[r] &&
      this.worldGrid[c] &&
      typeof this.worldGrid[r][c] === "string"
    );
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
  objects: [CollectableObject],
});

exports.GameState = State;
