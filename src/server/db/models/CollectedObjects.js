const mongoose = require("mongoose");

const collectedObjectsSchema = new mongoose.Schema({
    r: Number,
    c: Number,
});

module.exports = mongoose.model("CollectedObjects", collectedObjectsSchema);
