const mongoose = require("mongoose");

const gameStateSchema = new mongoose.Schema({
  day: {
    type: Number,
    index: true,
  },
  dayDuration: Number,
  gameStartTimestamp: Number,
});

module.exports = mongoose.model("GameState", gameStateSchema);
