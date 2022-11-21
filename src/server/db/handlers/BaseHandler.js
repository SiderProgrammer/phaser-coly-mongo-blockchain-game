const Players = require("../models/Player");
const GameState = require("../models/GameState");
const Days = require("../models/Days");

class BaseHandler {
  constructor() {}

  findPlayer(address) {
    return Players.findOne({ address });
  }

  findPlayerWizards(address) {
    return this.findPlayer(address).populate("wizards");
  }

  getGameState() {
    return GameState.findOne({}).lean().select("-_id");
  }

  getDayData(day) {
    return Days.findOne({ day }).lean().select("-_id");
  }
}
module.exports = BaseHandler;
