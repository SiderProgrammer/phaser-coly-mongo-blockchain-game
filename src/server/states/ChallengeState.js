const schema = require("@colyseus/schema");
const { Wizard } = require("../entities/Wizard");
const DatabaseManager = require("../db/databaseManager");
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

const db = new DatabaseManager();

class State extends schema.Schema {
  constructor(presenceEmit, challengeData) {
    super();

    this.startPosition = challengeData.startPosition;

    this.mapManager = new MapManager(this, worldMap);
    this.mapLayers = this.mapManager.getWorldMap();
    this.mapGridManager = new MapGridManager(this);
    this.worldGrid = this.mapGridManager.createWorldGrid();

    this.mapGridManager.addLayersToGrid(this.mapLayers);

    this.wizard = new Wizard("0", {
      x: this.startPosition.x,
      y: this.startPosition.y,
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

    if (
      !this.mapGridManager.isTileWalkable(this.wizard, dir.x, dir.y, TILE_SIZE)
    ) {
      return;
    }

    this.wizard.move(dir.x, dir.y, TILE_SIZE);

    this.handleTile(this.wizard, this.wizard.x, this.wizard.y);
  }

  handleTile(player, x, y) {
    const { r, c } = this.mapGridManager.getRowColumnFromCoords(x, y);
    const tile = this.worldGrid[r][c];

    if (tile === "let") {
      this.challengeState = 0;
      db.killWizard(this.owner, this.wizardId);
      this.presenceEmit("wizardDied");
      console.log("Lost a challenge");
    } else if (tile === "met") {
      db.setCompletedDailyChallenge(this.owner, this.wizardId);
      this.challengeState = 1;

      console.log("Won a challenge");
    }
  }
}
schema.defineTypes(State, {
  wizard: Wizard,
  challengeState: "number",
});

exports.ChallengeState = State;
