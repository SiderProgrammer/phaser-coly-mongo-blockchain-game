import {
  CHALLENGE_META,
  CHALLENGE_OBSTACLES,
  CHALLENGE_PLAYER,
  PLAYER_SIZE,
  PRE_MOVE_DISTANCE,
  TILE_SIZE,
} from "../../shared/config";
import MapManager from "../../shared/mapManager";
import InputManager from "../components/InputManager";
import Wizard from "../entities/Wizard";
import { GET_CHALLENGE } from "../services/requests/requests";
import { CHALLENGE_SCENE } from "./currentScenes";
import worldMap from "../assets/tilemaps/sampleMapChallenge";
import MapGridManager from "../../shared/mapGridManager";
import SoundManager from "../components/SoundManager";

class Challenge extends Phaser.Scene {
  constructor() {
    super("challenge");
  }

  preload() {}

  async create({ server, onLoseChallenge, onWinChallenge, wizardId }) {
    CHALLENGE_SCENE.setScene(this);
    this.server = server;
    this.onLoseChallenge = onLoseChallenge;
    this.onWinChallenge = onWinChallenge;

    this.gw = this.game.renderer.width;
    this.gh = this.game.renderer.height;

    this.challengeData = await (await GET_CHALLENGE()).json();

    this.map = this.make.tilemap({ key: "challengeMap" });
    const worldTileset = this.map.addTilesetImage("tiles32x32", "tiles32x32");

    this.layers = {
      groundLayer: this.map.createLayer("ground", worldTileset),
      obstaclesLayer: this.map.createLayer("obstacles", worldTileset),
      metaLayer: this.map.createLayer("meta", worldTileset),
    };

    //this.layers.obstaclesLayer.setCollisionByExclusion([-1]);

    this.mapManager = new MapManager(this, worldMap);
    this.mapLayers = this.mapManager.getWorldMap();

    this.mapGridManager = new MapGridManager(this);
    this.worldGrid = this.mapGridManager.createWorldGrid();

    this.mapGridManager.addLayersToGrid({
      obstacles: this.mapLayers.obstacles,
      meta: this.mapLayers.meta,
    });

    this.me = null;

    this.inputManager = new InputManager(this);

    this.add.text(this.gw / 2, 150, this.challengeData.dailyMessage);
    await this.server.handleChallengeJoin(wizardId);
  }

  playerMoved(dir) {
    if (!this.me || !this.me.canMove) return;

    SoundManager.play("CharacterMove");

    this.me.canMove = false;

    this.me.preMove(dir, PRE_MOVE_DISTANCE, () => {
      if (
        !this.mapGridManager.isTileWalkable(this.me, dir.x, dir.y, TILE_SIZE)
      ) {
        this.me.reversePreMove();
      }
    });

    const action = {
      type: "move",
      playerId: this.playerId,
      dir,
    };

    this.server.handleActionSendInChallenge(action);
  }

  handleChangeState(changedData) {
    // TODO : improve this function code
    const updatedState = changedData.find(
      (data) => data.field === "challengeState"
    );

    if (updatedState) {
      if (updatedState.value === 0) {
        this.add.text(
          this.gw / 2,
          this.gh / 2 - 100,
          this.challengeData.loseMessage,
          { font: "50px Arial" }
        );
        this.time.delayedCall(2000, () => this.onLoseChallenge());
      } else if (updatedState.value === 1) {
        this.add.text(
          this.gw / 2,
          this.gh / 2 - 100,
          this.challengeData.winMessage,
          { font: "50px Arial" }
        );
        this.time.delayedCall(2000, () => this.onWinChallenge());
      }
    }
  }

  handlePlayerAdd() {
    this.me = new Wizard(
      "0", // ? not needed here
      this,
      this.challengeData.startPosition.x,
      this.challengeData.startPosition.y,
      "player" // ? not needed here
    ).setDisplaySize(PLAYER_SIZE, PLAYER_SIZE);
  }

  handlePlayerMoved(changedData) {
    // TODO : improve this function code
    const updatedPosition = changedData.filter(
      (data) => data.field === "x" || data.field === "y"
    );
    const updatedX = updatedPosition.find((pos) => pos.field === "x")
      ? updatedPosition.find((pos) => pos.field === "x").value
      : this.me.x;
    const updatedY = updatedPosition.find((pos) => pos.field === "y")
      ? updatedPosition.find((pos) => pos.field === "y").value
      : this.me.y;

    this.me.walkTo(updatedX, updatedY);
  }
}

export default Challenge;
