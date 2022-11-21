const mongoose = require("mongoose");

const ChallengeSchema = new mongoose.Schema({
  day: { index: true, type: Number },
  winMessage: String,
  loseMessage: String,
  dailyMessage: String,
  startPosition: {
    r: Number,
    c: Number,
  },
  lethals: [{ x: Number, y: Number }],
  meta: { x: Number, y: Number },
});

module.exports = mongoose.model("Challenge", ChallengeSchema);
