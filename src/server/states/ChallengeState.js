const schema = require("@colyseus/schema");
const { Wizard } = require("../entities/Wizard");

const {
  CHALLENGE_PLAYER,
  CHALLENGE_OBSTACLES,
  CHALLENGE_META,
  PLAYER_SIZE,
  TILE_SIZE,
} = require("../../shared/config");
const MapManager = require("../../shared/mapManager");
const worldMap = require("../maps/challenge/1/sampleMapChallenge");
const MapGridManager = require("../../shared/mapGridManager");

class State extends schema.Schema {
  constructor(db, presenceEmit, challengeData) {
    super();
    this.db = db;

    this.isChallengeStarted = false;

    this.startPosition = challengeData.startPosition;

    this.mapManager = new MapManager(this, worldMap);
    this.mapLayers = this.mapManager.getWorldMap();
    this.mapGridManager = new MapGridManager(this);
    this.worldGrid = this.mapGridManager.createWorldGrid();

    this.mapGridManager.addLayersToGrid(this.mapLayers);

    this.wizard = new Wizard("0", {
      r: this.startPosition.r,
      c: this.startPosition.c,
    });

    this.challengeData = challengeData;
    this.presenceEmit = presenceEmit;

    this.challengeState = -1;
    this.owner = "";
    this.wizardId = "";
  }

  setWizardId(wizardId) {
    this.wizardId = wizardId;
  }

  setWizardOwner(address) {
    this.owner = address;
  }

  playerMove(dir) {
    if (!this.wizard) return;

    if (!this.mapGridManager.isTileWalkable(this.wizard, dir.x, dir.y)) {
      return;
    }

    this.wizard.move(dir.x, dir.y);

    this.handleTile(this.wizard, this.wizard.r, this.wizard.c);
  }

  handleTile(player, r, c) {
    const tile = this.worldGrid[r][c];
    if (this.challengeState === 0 || this.challengeState === 1) return;
    if (tile === "let") {
      this.challengeState = 0;
      this.db.killWizard(this.owner, this.wizardId);
      this.presenceEmit("wizardDied");
      console.log("Lost a challenge");
    } else if (tile === "met") {
      this.db.setCompletedDailyChallenge(this.owner, this.wizardId);
      this.challengeState = 1;

      console.log("Won a challenge");
    }
  }
}
schema.defineTypes(State, {
  wizard: Wizard,
  challengeState: "number",
  isChallengeStarted: "boolean",
});

exports.ChallengeState = State;
