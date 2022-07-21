const {
  WORLD_COLUMNS_COUNT,
  WORLD_ROWS_COUNT,
  TILE_SIZE,
} = require("../../shared/config");
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
        this.scene.worldGrid[tile.r][tile.c] = layer.slice(0, 3);
      });
    }
  }

  addWizardsToGrid(wizards) {
    const wizardsGridPos = wizards.map((wizard) =>
      this.getRowColumnFromCoords(wizard.x, wizard.y)
    );

    wizardsGridPos.forEach((pos) => {
      this.scene.worldGrid[pos.r][pos.c] = "wiz";
    });
  }

  setTileEmpty(x, y) {
    const { r, c } = this.getRowColumnFromCoords(x, y);
    this.scene.worldGrid[r][c] = "";
  }

  addWizardToGrid(wizard) {
    const { r, c } = this.getRowColumnFromCoords(wizard.x, wizard.y);
    this.scene.worldGrid[r][c] = "wiz";
  }

  getRowColumnFromCoords(x, y) {
    return {
      r: Math.floor(y / TILE_SIZE),
      c: Math.floor(x / TILE_SIZE),
    };
  }

  isWizardOnTile(x, y) {
    const { r, c } = this.getRowColumnFromCoords(x, y);

    return this.scene.worldGrid[r][c] === "wiz";
  }
  isTileFree(x, y) {
    const { r, c } = this.getRowColumnFromCoords(x, y);

    return this.scene.worldGrid[r][c] === "";
  }
  isTileObject(x, y) {
    const { r, c } = this.getRowColumnFromCoords(x, y);

    return this.scene.worldGrid[r][c] === "obj";
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

    const tile = this.scene.worldGrid[r][c];

    return tile === "" || tile === "let" || tile === "obj";
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
