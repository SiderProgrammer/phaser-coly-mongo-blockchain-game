const schema = require("@colyseus/schema");

class CollectableObject extends schema.Schema {
  constructor(r, c) {
    super();
    this.r = r;
    this.c = c;
  }
}

schema.defineTypes(CollectableObject, {
  r: "number",
  c: "number",
});

exports.CollectableObject = CollectableObject;
