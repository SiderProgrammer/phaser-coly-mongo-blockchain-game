const schema = require("@colyseus/schema");
const { PLAYER_SIZE, TILE_SIZE } = require("../../shared/config");

class collectedObjectCounter extends schema.Schema {
  constructor(type, value, wizardId) {
    super();
    this.type = type;
    this.value = value;
    this.wizardId = wizardId;
  }

  increaseCounter() {
    this.value++;
  }
}

schema.defineTypes(collectedObjectCounter, {
  type: "string",
  value: "number",
  wizardId: "string",
});

class Wizard extends schema.Schema {
  constructor(id, config) {
    super();
    this.id = id;
    this.r = config.r;
    this.c = config.c;
    this.size = PLAYER_SIZE;
    this.name = config.name;
    this.isSelected = false;
    this.isAlive = config.isAlive;
    this.dailyChallengeCompleted = config.dailyChallengeCompleted;
    this.movesLeft = config.movesLeft;

    this.collectedObjectsCount = new schema.MapSchema();
    for (const object in config.collectedObjectsCount) {
      this.collectedObjectsCount.set(
        object,
        new collectedObjectCounter(
          object,
          config.collectedObjectsCount[object],
          this.id
        )
      );
    }
  }

  increaseCollectedObjects(type) {
    this.collectedObjectsCount.get(type).increaseCounter();
  }

  move(dirX, dirY) {
    this.r += dirY;
    this.c += dirX;
  }
}

schema.defineTypes(Wizard, {
  id: "string",
  r: "number",
  c: "number",
  size: "number",
  name: "string",
  isSelected: "boolean",
  isAlive: "boolean",
  dailyChallengeCompleted: "boolean",
  movesLeft: "number",
  collectedObjectsCount: { map: collectedObjectCounter },
});

exports.Wizard = Wizard;
