const mongoose = require("mongoose");

const wizardSchema = new mongoose.Schema({
  x: Number,
  y: Number,
  name: String,
  hasCustomName: Boolean,
  isAlive: Boolean,
  dailyChallengeCompleted: Boolean,
  collectedObjectsCount: {
    1: { type: "Number" },
    2: { type: "Number" },
    3: { type: "Number" },
  },
  movesLeft: Number,
  player: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Player",
  },
});

module.exports = mongoose.model("Wizard", wizardSchema);
