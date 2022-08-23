import Phaser from "phaser";
import {
  HUD_HEIGHT,
  HUD_WIDTH,
  PRE_MOVE_DISTANCE,
  TILE_SIZE,
  WORLD_SIZE,
} from "../../shared/config";
import MapGridManager from "../../shared/mapGridManager";
import MapManager from "../../shared/mapManager";
import Button from "../components/Button";
import InputManager from "../components/InputManager";
import SoundManager from "../components/SoundManager";
import Player from "../entities/Player";
import {
  GET_ALL_COLLECTED_OBJECTS,
  GET_ALL_PLAYERS,
  GET_OBSTACLES,
} from "../services/requests/requests";
import { WORLD_SCENE } from "./currentScenes";
import worldMap from "../assets/tilemaps/sampleMap";
import AlignGrid from "./test";
import { calculateRegistrationPhaseRemainingTime } from "../../shared/utils";

class World extends Phaser.Scene {
  constructor() {
    super("world");
  }

  preload() {}

  async create({ server, onPlayChallenge, gameState }) {
    WORLD_SCENE.setScene(this);
    this.server = server;
    this.onPlayChallenge = onPlayChallenge;
    this.gameState = gameState;

    this.isWorld = true; // just for now
    this.gw = this.game.renderer.width;
    this.gh = this.game.renderer.height;

    this.players = [];
    this.me = null;

    const collectedObjects = await (await GET_ALL_COLLECTED_OBJECTS()).json();
    // const obstacles = await (await GET_OBSTACLES()).json();
    this.mapManager = new MapManager(this, worldMap);
    this.mapLayers = this.mapManager.getWorldMap();
    this.mapManager.removeCollectedObjects(collectedObjects);

    this.inputManager = new InputManager(this);

    this.map = this.make.tilemap({ key: "worldMap" });
    const worldTileset = this.map.addTilesetImage("tiles32x32", "tiles32x32");

    this.layers = {
      groundLayer: this.map.createLayer("ground", worldTileset),
      obstaclesLayer: this.map.createLayer("obstacles", worldTileset),
      objectsLayer1: this.map.createLayer("objects", worldTileset),
      objectsLayer2: this.map.createLayer("objects2", worldTileset),
      objectsLayer3: this.map.createLayer("objects3", worldTileset),
    };

    this.layers.obstaclesLayer.setCollisionByExclusion([-1]);

    this.addSoundButton();
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
    this.mapGridManager.addLayersToGrid({
      obstacles: this.mapLayers.obstacles,
    });
    this.playersSavedState.forEach((player) => {
      this.mapGridManager.addWizardsToGrid(player.wizards);
    });

    this.playerId = this.server.getPlayerId();
    this.walletAddress = this.server.getPlayerWalletAddress();

    collectedObjects.forEach((obj) =>
      this.removeTileFromMap(obj.c, obj.r, obj.type)
    );

    SoundManager.play("BackgroundMusic", { loop: true });

    if (this.server.isRegistrationPhase) {
      this.registrationPhaseTimer = this.add
        .text(this.gw / 2, 250, this.getRegistrationPhaseRemainingTime(), {
          font: "50px Arial",
        })
        .setOrigin(0.5)
        .setScrollFactor(0, 0)
        .setDepth(1000);

      this.registrationPhaserCountdown = setInterval(() => {
        if (this.registrationPhaseTimer.active) {
          this.registrationPhaseTimer.setText(
            this.getRegistrationPhaseRemainingTime()
          );
        }
      }, 1000);
    }

    // var gridConfig = {
    //   scene: this,
    //   cols: 5,
    //   rows: 5,
    //   width: this.gw,
    //   height: this.gh,
    // };
    // this.aGrid = new AlignGrid(gridConfig);
    // this.aGrid.showNumbers();
  }

  getRegistrationPhaseRemainingTime() {
    this.registrationPhaseRemainingTime =
      calculateRegistrationPhaseRemainingTime(this.gameState);
    const newDateTime = new Date(this.registrationPhaseRemainingTime);

    if (this.registrationPhaseRemainingTime <= 0) {
      clearInterval(this.server.registrationPhaserCountdown);
      this.registrationPhaseRemainingTime = 0;
      this.registrationPhaseTimer.destroy();
      this.server.isRegistrationPhase = false;
    }

    return (
      "Time to start: " +
      (newDateTime.getHours() - 1) +
      "h" +
      newDateTime.getMinutes() +
      "m" +
      newDateTime.getSeconds() +
      "s"
    );
  }

  update() {
    if (!this.me || this.server.isRegistrationPhase) return;

    this.inputManager && this.inputManager.update();

    this.me.wizards.forEach((wizard) => {
      // we can handle it better
      // maybe switch .canMove to = true when 90% of the movement is done, not 100%
      if (wizard.canMove) wizard.play("idle", true);
    });
  }

  removeTileFromMap(c, r, type) {
    this.map.removeTileAt(c, r, true, true, this.layers["objectsLayer" + type]);
  }

  playerMoved(dir) {
    const wizardMoved = this.me.getSelectedWizard();
    if (!wizardMoved || !wizardMoved.canMove || wizardMoved.movesLeft <= 0)
      return;

    SoundManager.play("CharacterMove");

    const isTileWalkable = this.mapGridManager.isTileWalkable(
      wizardMoved,
      dir.x,
      dir.y
    );

    wizardMoved.canMove = false;

    wizardMoved.preMove(dir, PRE_MOVE_DISTANCE, () => {
      if (!isTileWalkable) {
        wizardMoved.reversePreMove();
      }
    });

    if (isTileWalkable) {
      const action = {
        type: "move",
        playerId: this.playerId,
        dir,
      };

      this.server.handleActionSend(action);
    }
  }
  showPlayChallengeButton(bool) {
    this.playChallengeButton.setVisible(bool).setActive(bool);
  }
  addPlayChallengeButton() {
    const button = new Button(this, 350, this.gh - 60, "challengeButton");
    button.setScrollFactor(0, 0).setDepth(1000);

    button.onClick(() => {
      if (this.server.isRegistrationPhase) return;
      this.onPlayChallenge(this.me.getSelectedWizardId());
    });

    this.playChallengeButton = button;
    this.showPlayChallengeButton(false);
  }

  addSoundButton() {
    const button = this.add
      .text(this.gw - 20, HUD_HEIGHT + 20, "mute", { font: "40px Arial" })
      .setOrigin(1, 0);

    button.setInteractive().on("pointerdown", () => {
      if (this.game.sound.mute) {
        button.setText("mute");
        this.game.sound.mute = false;
      } else {
        button.setText("unmute");
        this.game.sound.mute = true;
      }
    });

    button.setScrollFactor(0, 0).setDepth(1000);
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
    this.removeTileFromMap(object.c, object.r, object.type);
  }

  // TODO : maybe search for a better solution
  // maybe use map for players instead of array
  async refreshOfflinePlayers() {
    this.playersSavedState = await (await GET_ALL_PLAYERS()).json(); // maybe filter query from online players
    this.players.forEach((player) => {
      if (!player.isOnline) {
        // TODO : fix it

        const playerFromDB = this.playersSavedState.find(
          (p) => p.address === player.walletAddress
        );
        playerFromDB.wizards.forEach((wizard, i) => {
          if (!wizard.isAlive) {
            player.wizards[i].kill();
          }
        });
      }
    });
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

    this.mapGridManager.addWizardsToGrid(addedPlayer.wizards);

    if (isMe) {
      this.me = addedPlayer;

      // this.me.setSelectedWizardId(
      //   _player.wizards.findIndex((wizard) => wizard.isSelected)
      // );
    }
  }
  handlePlayerRemove(_player) {
    this.players.find(
      (player) => player.walletAddress === _player.address
    ).isOnline = false;
  }

  getPlayerFromPlayers(_player) {
    return this.players.find(
      // check if player was previously in database
      (player) => player.walletAddress === _player.address
    );
  }

  removePlayerFromPlayers(playerFromPlayers, playerFromServer) {
    this.mapGridManager.removeWizardsFromGrid(playerFromPlayers.wizards);
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
