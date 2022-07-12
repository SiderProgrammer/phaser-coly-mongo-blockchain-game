import {
  CHALLENGE_META,
  CHALLENGE_OBSTACLES,
  CHALLENGE_PLAYER,
  PLAYER_SIZE,
} from "../../shared/config";
import InputManager from "../components/InputManager";
import Wizard from "../entities/Wizard";

class Challenge extends Phaser.Scene {
  constructor() {
    super("challenge");
  }

  preload() {}

  async create({ server, onLoseChallenge, onWinChallenge, wizardId }) {
    this.server = server;
    this.onLoseChallenge = onLoseChallenge;
    this.onWinChallenge = onWinChallenge;

    this.add
      .image(CHALLENGE_META.x, CHALLENGE_META.y, "white")
      .setDisplaySize(CHALLENGE_META.size, CHALLENGE_META.size);

    this.add
      .image(CHALLENGE_OBSTACLES[0].x, CHALLENGE_OBSTACLES[0].y, "red")
      .setDisplaySize(CHALLENGE_OBSTACLES[0].size, CHALLENGE_OBSTACLES[0].size);

    this.me = null;

    this.server.onPlayerJoinedChallenge(this.handlePlayerAdd, this);
    this.server.onPlayerMovedInChallenge(this.handlePlayerMove, this);
    this.server.onChallengeStateChanged(this.handleChangeState, this);

    this.inputManager = new InputManager(this);

    await this.server.handleChallengeJoin(wizardId);
  }

  update() {
    this.inputManager && this.inputManager.update();
  }

  playerMoved(dir) {
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
        this.onLoseChallenge();
      } else if (updatedState.value === 1) {
        this.onWinChallenge();
      }
    }
  }

  handlePlayerAdd() {
    this.me = new Wizard(
      "0", // ? not needed here
      this,
      CHALLENGE_PLAYER.x,
      CHALLENGE_PLAYER.y,
      "wizard" // ? not needed here
    ).setDisplaySize(PLAYER_SIZE, PLAYER_SIZE);
  }

  handlePlayerMove(changedData) {
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

    this.me.setPosition(updatedX, updatedY);
  }
}

export default Challenge;
