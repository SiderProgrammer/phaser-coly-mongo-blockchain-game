import Phaser from "phaser";
import Button from "../components/Button";
import Player from "../entities/Player";
import { GET_ALL_PLAYERS } from "../services/requests/requests";

class World extends Phaser.Scene {
  constructor() {
    super("world");
    // const host = window.document.location.host.replace(/:.*/, '');
    // const port = process.env.NODE_ENV !== 'production' ? Constants.WS_PORT : window.location.port;
    // const url = `${window.location.protocol.replace('http', 'ws')}//${host}${port ? `:${port}` : ''}`;
  }

  preload() {}

  async create({ server, onPlayChallenge, joinServer }) {
    //this.add.image(400, 200, "logo").setScale(0.2); // test obstacle
    this.server = server;
    this.onPlayChallenge = onPlayChallenge;
    this.playersSavedState = await (await GET_ALL_PLAYERS()).json();

    this.gw = this.game.renderer.width;
    this.gh = this.game.renderer.height;
    // if (!this.server) {
    //   throw new Error("server instance missing");
    // }

    this.playerId = this.server.getPlayerId();

    this.players = [];
    this.me = null;

    this.retrievePlayersState();
    this.server.onPlayerJoined(this.handlePlayerAdd, this);
    this.server.onPlayerRemoved(this.handlePlayerRemove, this);
    this.server.onWizardChanged(this.handleWizardChanged, this);

    this.cursors = this.input.keyboard.createCursorKeys();
    this.addPlayChallengeButton();

    await this.server.handleWorldJoin();
  }

  update() {
    if (!this.cursors) return;

    const dir = {
      // vector to determine move direction
      x: 0,
      y: 0,
    };

    if (
      this.cursors.up.isDown ||
      this.cursors.down.isDown ||
      this.cursors.left.isDown ||
      this.cursors.right.isDown
    ) {
      if (this.cursors.up.isDown) {
        dir.y -= 1;
      }

      if (this.cursors.down.isDown) {
        dir.y += 1;
      }

      if (this.cursors.left.isDown) {
        dir.x -= 1;
      }

      if (this.cursors.right.isDown) {
        dir.x += 1;
      }

      if (dir.x != 0 || dir.y != 0) {
        const action = {
          type: "move",
          ts: Date.now(),
          playerId: this.playerId,
          dir,
        };

        this.server.handleActionSend(action);
      }
    }
  }

  addPlayChallengeButton() {
    const button = new Button(this, 350, this.gh - 60, "challengeButton");
    button.setScrollFactor(0, 0).setDepth(1000);
    button.onClick(() => this.onPlayChallenge(this.me.getSelectedWizardId()));
  }

  isWalletAddressMe() {}

  isPlayerIdMe(playerId) {
    return playerId === this.server.getPlayerId();
  }

  handleWizardChanged(wizard) {
    const wizardOwner = this.players.find(
      (player) => player.sessionId === wizard.playerId
    );

    wizardOwner.updateWizard(wizard);
  }

  retrievePlayersState() {
    this.playersSavedState.forEach((player) => {
      // console.log(player);
      this.handlePlayerAddFromDB(player, player.address);
    });
  }

  handlePlayerAddFromDB(player, address) {
    if (address === this.server.walletAddress) return;

    this.playerAdd("", address, player, false);
  }

  handlePlayerAdd(_player) {
    // ? handle add player which just joined a room
    //console.log("Player added", player, playerId);

    // console.log(player);
    // const me = this.players.some((player) => player.walletAddress === address); // check if ME exists

    // if (me) return;

    //console.log(player, this.players);
    //console.log(this.players, player.address);
    const playerFromPlayers = this.players.find(
      (player) => player.walletAddress === _player.address
    );

    if (playerFromPlayers) {
      // playerFromPlayers.updateWizards(_player.wizards);
      // playerFromPlayers.sessionId = _player.id;
      playerFromPlayers.destroy();
      const index = this.players.findIndex(
        (player) => player.walletAddress === _player.address
      );

      this.players.splice(index, 1);
      // return;
    }

    const isMe = this.isPlayerIdMe(_player.id);
    const walletAddress = isMe ? this.server.walletAddress : _player.address;

    const addedPlayer = this.playerAdd(
      _player.id,
      walletAddress,
      _player,
      isMe
    );

    if (isMe) {
      this.me = addedPlayer;
      this.me.setSelectedWizardId(this.me.getSelectedWizardId());
    }
  }

  handlePlayerRemove(_player) {
    //this.players.find(player => player.sessionId === _player.id)
  }

  playerAdd(sessionId, address, _player, isMe) {
    const player = new Player(this, sessionId, address, isMe);
    player.addWizards(_player.wizards);

    this.players.push(player);

    return player;
  }

  // handlePlayerUpdate(player, playerId) {
  //   const isMe = this.isPlayerIdMe(playerId);
  //   this.playerUpdate(playerId, player, isMe);
  // }

  // playerUpdate(playerId, player, isMe) {
  //   const playerToUpdate = this.players.find(
  //     (player) => player.playerId === playerId
  //   );

  //   playerToUpdate.x = player.x;
  //   playerToUpdate.y = player.y;
  // }

  //   handleMessage(type, message) {
  //     console.log(type, message);
  //     switch (type) {
  //       case "waiting":
  //         announce = `Waiting for other players...`;
  //         break;
  //       case "start":
  //         announce = `Game starts`;
  //         break;
  //       case "won":
  //         announce = `${message.params.name} wins!`;
  //         break;
  //       case "timeout":
  //         announce = `Timeout...`;
  //         break;
  //       default:
  //         break;
  //     }

  //     this.updateRoom();
  //   }

  //   updateRoom() {}
}

export default World;
