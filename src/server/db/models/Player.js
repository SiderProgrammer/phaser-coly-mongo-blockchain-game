const mongoose = require("mongoose");

const playerSchema = new mongoose.Schema({
  address: {
    //alias:"walletAddress",
    type: String,
  },

  wizards: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Wizard",
    },
  ],
});

module.exports = mongoose.model("Players", playerSchema);
