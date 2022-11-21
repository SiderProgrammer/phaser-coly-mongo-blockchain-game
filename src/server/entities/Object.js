const schema = require("@colyseus/schema");

class CollectableObject extends schema.Schema {
  constructor(r, c, type) {
    super();
    this.r = r;
    this.c = c;
    this.type = type;
  }
}

schema.defineTypes(CollectableObject, {
  r: "number",
  c: "number",
  type: "string",
});

exports.CollectableObject = CollectableObject;
