const schema = require("@colyseus/schema");

class Wizard extends schema.Schema {
  constructor(id, x, y, size, name) {
    super();
    this.id = id;
    this.x = x;
    this.y = y;
    this.size = size;
    this.name = name;
    this.isSelected = false;
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
});

exports.Wizard = Wizard;
