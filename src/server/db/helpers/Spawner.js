const {
  TILE_SIZE,
  WORLD_COLUMNS_COUNT,
  WORLD_ROWS_COUNT,
} = require("../../../shared/config");
const { randomInRange } = require("../../../shared/utils");

class Spawner {
  constructor(scene) {
    this.scene = scene;
  }
  generateRandomCenterPosition() {
    const r = randomInRange(
      WORLD_ROWS_COUNT / 4,
      WORLD_ROWS_COUNT - WORLD_ROWS_COUNT / 4
    );
    const c = randomInRange(
      WORLD_COLUMNS_COUNT / 4,
      WORLD_COLUMNS_COUNT - WORLD_COLUMNS_COUNT / 4
    );
    return { r, c };
  }
  getNewSpawnPosition() {
    let r,
      c = 0;

    do {
      const newPos = this.generateRandomCenterPosition();
      c = newPos.c;
      r = newPos.r;
    } while (this.scene.worldGrid[r][c] !== "");

    return {
      r,
      c,
    };
  }
}

module.exports = Spawner;
