import Phaser from "phaser";
import {
  HUD_HEIGHT,
  HUD_WIDTH,
  PRE_MOVE_DISTANCE,
  TILE_SIZE,
  WORLD_SIZE,
} from "../../shared/config";
import MapGridManager from "../../shared/mapGridManager";
import Button from "../components/Button";
import InputManager from "../components/InputManager";
import Player from "../entities/Player";
import {
  GET_ALL_COLLECTED_OBJECTS,
  GET_OBSTACLES,
} from "../services/requests/requests";
import { WORLD_SCENE } from "./currentScenes";

class World extends Phaser.Scene {
  constructor() {
    super("world");
  }

  preload() {}

  async create({ server, onPlayChallenge }) {
    WORLD_SCENE.setScene(this);
    this.server = server;
    this.onPlayChallenge = onPlayChallenge;
    //this.playersSavedState = await (await GET_ALL_PLAYERS()).json();

    this.gw = this.game.renderer.width;
    this.gh = this.game.renderer.height;

    this.players = [];
    this.me = null;

    const collectedObjects = await (await GET_ALL_COLLECTED_OBJECTS()).json();
    const obstacles = await (await GET_OBSTACLES()).json();

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

    this.mapGridManager = new MapGridManager(this);
    this.worldGrid = this.mapGridManager.createWorldGrid();
    this.mapGridManager.addLayersToGrid({ obstacles });
    this.playersSavedState.forEach((player) => {
      this.mapGridManager.addWizardsToGrid(player.wizards);
    });

    this.playerId = this.server.getPlayerId();
    this.walletAddress = this.server.getPlayerWalletAddress();

    collectedObjects.forEach((obj) => this.map.removeTileAt(obj.c, obj.r));
  }

  playerMoved(dir) {
    // TODO : make pre move animations with 2 first frame of movement
    // TODO : play pre move animation when hit obstacle/bounds/player and on complete return player to previous position
    // TODO : keep player movement animation on hold when there is no server response yet
    const wizardMoved = this.me.getSelectedWizard();
    if (!wizardMoved.canMove) return;

    wizardMoved.canMove = false;

    wizardMoved.preMove(dir, PRE_MOVE_DISTANCE, () => {
      if (
        !this.mapGridManager.isTileWalkable(
          wizardMoved,
          dir.x,
          dir.y,
          TILE_SIZE
        )
      ) {
        wizardMoved.reversePreMove();
      }
    });

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

  isPlayerIdMe(playerId) {
    return playerId === this.playerId;
  }

  handleWizardChanged(wizard, playerId) {
    const wizardOwner = this.players.find(
      (player) => player.sessionId === playerId
    );

    wizardOwner.updateWizard(wizard);
  }

  handleObjectRemoved(object) {
    this.map.removeTileAt(object.c, object.r);
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
