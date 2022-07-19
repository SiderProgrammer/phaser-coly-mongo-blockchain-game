import Phaser from "phaser";
import {
  HUD_HEIGHT,
  HUD_WIDTH,
  PRE_MOVE_DISTANCE,
  WORLD_SIZE,
} from "../../shared/config";
import Button from "../components/Button";
import InputManager from "../components/InputManager";
import Player from "../entities/Player";

class World extends Phaser.Scene {
  constructor() {
    super("world");
  }

  preload() {}

  async create({ server, onPlayChallenge }) {
    this.server = server;
    this.onPlayChallenge = onPlayChallenge;
    //this.playersSavedState = await (await GET_ALL_PLAYERS()).json();

    this.gw = this.game.renderer.width;
    this.gh = this.game.renderer.height;

    this.players = [];
    this.me = null;

    this.server.onPlayerJoined(this.handlePlayerAdd, this);
    this.server.onWizardChanged(this.handleWizardChanged, this);

    this.inputManager = new InputManager(this);

    this.map = this.make.tilemap({ key: "worldMap" });
    const worldTileset = this.map.addTilesetImage("tiles32x32", "tiles32x32");

    this.groundLayer = this.map.createLayer("ground", worldTileset);
    this.obstaclesLayer = this.map.createLayer("obstacles", worldTileset);
    this.objectsLayer = this.map.createLayer("objects", worldTileset);
    this.obstaclesLayer.setCollisionByExclusion([-1]);

    this.addPlayChallengeButton();
    this.cameras.main.setBounds(
      -HUD_WIDTH,
      -HUD_HEIGHT,
      WORLD_SIZE.WIDTH + HUD_WIDTH,
      WORLD_SIZE.HEIGHT + HUD_HEIGHT
    );

    await this.server.handleWorldJoin();

    this.playersSavedState = this.server.playersSavedState;
    this.addPlayersFromSavedState();

    this.playerId = this.server.getPlayerId();
    this.walletAddress = this.server.getPlayerWalletAddress();
  }

  update() {
    //this.inputManager && this.inputManager.update();
  }

  playerMoved(dir) {
    this.me.preMove(dir);

    const action = {
      type: "move",
      playerId: this.playerId,
      dir,
    };

    this.server.handleActionSend(action);
  }

  addPlayChallengeButton() {
    const button = new Button(this, 350, this.gh - 60, "challengeButton");
    button.setScrollFactor(0, 0).setDepth(1000);
    button.onClick(() => this.onPlayChallenge(this.me.getSelectedWizardId()));
  }

  // isWalletAddressMe() {}

  isPlayerIdMe(playerId) {
    return playerId === this.playerId;
  }

  handleWizardChanged(wizard, playerId) {
    const wizardOwner = this.players.find(
      (player) => player.sessionId === playerId
    );

    wizardOwner.updateWizard(wizard);
  }

  addPlayersFromSavedState() {
    this.playersSavedState.forEach((player) => {
      if (player.address === this.walletAddress) return;
      this.playerAdd("", player.address, player, false);
    });
  }

  handlePlayerAdd(_player) {
    // ? handle add player which just joined a room

    const playerFromPlayers = this.getPlayerFromPlayers(_player);

    if (playerFromPlayers) {
      this.removePlayerFromPlayers(playerFromPlayers, _player);
    }

    const isMe = this.isPlayerIdMe(_player.id);
    const walletAddress = isMe ? this.walletAddress : _player.address;

    const addedPlayer = this.playerAdd(
      _player.id,
      walletAddress,
      _player,
      isMe
    );

    if (isMe) {
      this.me = addedPlayer;

      this.me.setSelectedWizardId(
        _player.wizards.findIndex((wizard) => wizard.isSelected)
      );
    }
  }

  getPlayerFromPlayers(_player) {
    return this.players.find(
      // check if player was previously in database
      (player) => player.walletAddress === _player.address
    );
  }

  removePlayerFromPlayers(playerFromPlayers, playerFromServer) {
    playerFromPlayers.destroy();
    const index = this.players.findIndex(
      (player) => player.walletAddress === playerFromServer.address
    );

    this.players.splice(index, 1);
  }

  playerAdd(sessionId, address, _player, isMe) {
    const player = new Player(this, sessionId, address, isMe);
    player.addWizards(_player.wizards);

    this.players.push(player);

    return player;
  }
}

export default World;
