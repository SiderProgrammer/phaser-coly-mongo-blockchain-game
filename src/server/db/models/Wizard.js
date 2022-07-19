const mongoose = require("mongoose");

const wizardSchema = new mongoose.Schema({
  x: Number,
  y: Number,
  name: String,
  isAlive: Boolean,
  dailyChallengeCompleted: Boolean,
  collectedObjectsCount: Number,
  player: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Player",
  },
});

module.exports = mongoose.model("Wizard", wizardSchema);
