const schema = require("@colyseus/schema");
const { PLAYER_SIZE } = require("../../shared/config");

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
    this.x = config.x;
    this.y = config.y;
    this.size = PLAYER_SIZE;
    this.name = config.name;
    this.isSelected = false;
    this.isAlive = config.isAlive;
    this.dailyChallengeCompleted = config.dailyChallengeCompleted;

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

  move(dirX, dirY, speed) {
    const speedX = speed * dirX;
    const speedY = speed * dirY;

    this.x += speedX;
    this.y += speedY;
  }
}

schema.defineTypes(Wizard, {
  id: "string",
  x: "number",
  y: "number",
  size: "number",
  name: "string",
  isSelected: "boolean",
  isAlive: "boolean",
  dailyChallengeCompleted: "boolean",
  collectedObjectsCount: { map: collectedObjectCounter },
});

exports.Wizard = Wizard;
