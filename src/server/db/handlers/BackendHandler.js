const Wizard = require("../models/Wizard");
const Players = require("../models/Player");
const GameState = require("../models/GameState");
const CollectedObjects = require("../models/CollectedObjects");

const { DAILY_MAX_MOVES } = require("../../../shared/config");
const Challenge = require("../models/Challenge");

const BaseHandler = require("./BaseHandler");

// backend manager returns queries
// frontend manager sends responses to client
class BackendHandler extends BaseHandler {
  constructor(main) {
    super();
    this.main = main;
  }

  getPlayerWizardName(address, wizardId) {
    return this.findPlayerWizards(address).then((state) => {
      return state.wizards[wizardId].name;
    });
  }
  canWizardPlayChallenge(address, wizardId) {
    return this.findPlayerWizards(address).then((state) => {
      const wizard = state.wizards[wizardId];
      return !wizard.dailyChallengeCompleted && wizard.isAlive;
    });
  }

  killDelayedWizards() {
    return Wizard.updateMany(
      { dailyChallengeCompleted: false },
      { $set: { isAlive: false } }
    );
  }

  refreshWizards() {
    return Wizard.updateMany(
      { dailyChallengeCompleted: true },
      { $set: { dailyChallengeCompleted: false, movesLeft: DAILY_MAX_MOVES } }
    );
  }

  refreshDay(daysToAdd = 1) {
    return GameState.updateOne({}, { $inc: { day: daysToAdd } })
      .then(this.killDelayedWizards) //TODO:check if these work
      .then(this.refreshWizards); //TODO:check if these work
  }

  getGameStateQuery() {
    return this.getGameState();
  }
  countWizards(condition = {}) {
    // TODO : Handle Errors
    return Wizard.countDocuments(condition);
  }

  getAllPlayersQuery() {
    // TODO : Handle Errors
    return Players.find({}).lean().populate("wizards").select("-_id");
  }

  getAllCollectedObjectsQuery() {
    return CollectedObjects.find().lean().select("-_id");
  }

  getDayQuery(day) {
    return this.getDayData(day);
  }

  getPlayerQuery(address) {
    // TODO : Handle Errors
    return this.findPlayerWizards(address).lean().select("-_id");
  }

  getChallengeQuery() {
    return this.getGameState().then((state) => {
      return Challenge.findOne({ day: state.day })
        .lean()
        .select("lethals startPosition meta");
    });
  }

  setCompletedDailyChallenge(address, wizardId) {
    return this.findPlayerWizards(address).then((state) => {
      state.wizards[wizardId].dailyChallengeCompleted = true;
      state.wizards[wizardId].save();
    });
  }

  killWizard(address, wizardId) {
    // TODO : Handle Errors  && Improve this Query (search for better solution)

    return this.findPlayerWizards(address).then((state) => {
      // ? Maybe Wizards.updateOne({...})
      state.wizards[wizardId].isAlive = false;
      state.wizards[wizardId].save();
    });
  }

  setObjectCollected(r, c, type) {
    CollectedObjects.create({ r, c, type });
  }

  increaseWizardObjectsCount(address, wizardId, type) {
    // TODO : Handle Errors  && Improve this Query (search for better solution)

    this.findPlayerWizards(address).then((state) => {
      state.wizards[wizardId].collectedObjectsCount[type]++;
      state.wizards[wizardId].save();
    });
  }

  savePlayerWizards(address, wizards) {
    // TODO : Handle Errors  && Improve this Query (search for better solution)

    this.findPlayerWizards(address)
      .then((state) => {
        wizards.forEach((wizard, i) => {
          state.wizards[i].r = wizard.r;
          state.wizards[i].c = wizard.c;
          state.wizards[i].movesLeft = wizard.movesLeft;
          state.wizards[i].save(); // ? improve saving code
        });
      })
      .catch((err) => {
        console.log(
          "Error while saving player wizards, player wallet address:",
          address,
          "error:",
          err
        );
      });
  }
}

module.exports = BackendHandler;
