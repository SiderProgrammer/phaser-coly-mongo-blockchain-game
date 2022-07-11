const mongoose = require("mongoose");

const gameStateSchema = new mongoose.Schema({
  day: {
    type: Number,
    index: true,
  },
  gameStartTimestamp: Number,
});

module.exports = mongoose.model("GameState", gameStateSchema);
