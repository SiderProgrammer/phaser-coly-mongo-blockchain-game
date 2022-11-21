const mongoose = require("mongoose");

const collectedObjectsSchema = new mongoose.Schema({
  r: Number,
  c: Number,
  type: "string",
});

module.exports = mongoose.model("CollectedObjects", collectedObjectsSchema);
