const mongoose = require("mongoose");

const daySchema = new mongoose.Schema({
  day: {
    type: Number,
    index: true,
  },
  slogan: String,
});

module.exports = mongoose.model("Day", daySchema);
