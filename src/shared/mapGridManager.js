const {
  WORLD_COLUMNS_COUNT,
  WORLD_ROWS_COUNT,
  TILE_SIZE,
} = require("./config");

class MapGridManager {
  constructor(scene) {
    this.scene = scene;
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
        let sign = layer.slice(0, 3);

        const isLastCharacterNumber = !!Number(layer[layer.length - 1]);

        // TODO : handle it better, change layer from objects to objects1

        if (sign === "obj") {
          if (isLastCharacterNumber) {
            sign = sign + layer[layer.length - 1]; // ? obj2, obj3
          } else {
            sign = sign + "1"; // ? obj
          }
        }

        this.scene.worldGrid[tile.r][tile.c] = sign;
      });
    }
  }

  removeWizardsFromGrid(wizards) {
    wizards.forEach((w) => {
      this.setTileEmpty(w.r, w.c);
    });
  }

  addWizardsToGrid(wizards) {
    wizards.forEach((w) => {
      this.addWizardToGrid(w);
    });
  }

  setTileEmpty(r, c) {
    this.scene.worldGrid[r][c] = "";
  }

  addWizardToGrid(wizard) {
    this.scene.worldGrid[wizard.r][wizard.c] = "wiz";
  }

  getRowColumnFromCoords(x, y) {
    return {
      r: Math.floor(y / TILE_SIZE),
      c: Math.floor(x / TILE_SIZE),
    };
  }

  isWizardOnTile(r, c) {
    return this.scene.worldGrid[r][c] === "wiz";
  }
  isTileFree(r, c) {
    return this.scene.worldGrid[r][c] === "";
  }
  isTileObject(r, c) {
    return this.scene.worldGrid[r][c].includes("obj");
  }
  isTileWalkable(wizard, dirX, dirY) {
    const r = wizard.r + dirY;
    const c = wizard.c + dirX;

    const isTileOutOfBounds = this.isTileOutOfBounds(r, c);
    if (isTileOutOfBounds) return false;

    const tile = this.scene.worldGrid[r][c];

    return (
      tile === "" || tile === "let" || tile.includes("obj") || tile === "met"
    );
  }

  isTileOutOfBounds(r, c) {
    return !(
      this.scene.worldGrid[r] &&
      this.scene.worldGrid[c] &&
      typeof this.scene.worldGrid[r][c] === "string"
    );
  }

  addMapBoundaryToGrid() {
    for (let c = 0; c < WORLD_COLUMNS_COUNT; c++) {
      this.scene.worldGrid[0][c] = "bon";
    }
    for (let c = 0; c < WORLD_COLUMNS_COUNT; c++) {
      this.scene.worldGrid[WORLD_ROWS_COUNT - 1][c] = "bon";
    }

    for (let r = 0; r < WORLD_ROWS_COUNT; r++) {
      this.scene.worldGrid[0][r] = "bon";
    }

    for (let r = 0; r < WORLD_ROWS_COUNT; r++) {
      this.scene.worldGrid[WORLD_COLUMNS_COUNT - 1][r] = "bon";
    }
  }
}
module.exports = MapGridManager;
