import Phaser from "phaser";
import Button from "../components/Button";
import Player from "../entities/Player";

class World extends Phaser.Scene {
  constructor() {
    super("world");
    // const host = window.document.location.host.replace(/:.*/, '');
    // const port = process.env.NODE_ENV !== 'production' ? Constants.WS_PORT : window.location.port;
    // const url = `${window.location.protocol.replace('http', 'ws')}//${host}${port ? `:${port}` : ''}`;
  }

  preload() {
    this.load.image("logo", "./src/client/assets/logo.png");
  }

  async create({ server, onPlayChallenge }) {
    //this.add.image(400, 200, "logo").setScale(0.2); // test obstacle
    this.server = server;
    this.onPlayChallenge = onPlayChallenge;

    if (!this.server) {
      throw new Error("server instance missing");
    }
    await this.server.join();
    this.playerId = this.server.getPlayerId();

    this.players = [];
    this.me = null;

    this.server.onPlayerJoined(this.handlePlayerAdd, this);
    this.server.onWizardChanged(this.handleWizardChanged, this);

    this.cursors = this.input.keyboard.createCursorKeys();
    this.addPlayChallengeButton();
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
    const button = new Button(this, 100, 600, "logo");
    button.addText("Play challenge");
    button.onClick(() => this.playChallenge());
  }

  playChallenge() {
    const action = {
      type: "play-challenge",
      ts: Date.now(),
      playerId: this.playerId,
      wizardId: this.me.getSelectedWizardId(),
    };

    this.server.handleActionSend(action);

    this.onPlayChallenge();
  }

  isPlayerIdMe(playerId) {
    return playerId === this.playerId;
  }

  handleWizardChanged(wizard) {
    const wizardOwner = this.players.find(
      (player) => player.playerId === wizard.ownerId
    );

    wizardOwner.updateWizard(wizard);
  }

  handlePlayerAdd(player, playerId) {
    console.log("Player added", player, playerId);

    const isMe = this.isPlayerIdMe(playerId);
    const addedPlayer = this.playerAdd(playerId, player, isMe);

    if (isMe) {
      this.addWizardsButtons(addedPlayer.wizards);
      this.me = addedPlayer;
    }
  }

  handlePlayerUpdate(player, playerId) {
    const isMe = this.isPlayerIdMe(playerId);
    this.playerUpdate(playerId, player, isMe);
  }

  playerUpdate(playerId, player, isMe) {
    const playerToUpdate = this.players.find(
      (player) => player.playerId === playerId
    );

    playerToUpdate.x = player.x;
    playerToUpdate.y = player.y;
  }

  playerAdd(playerId, _player, isMe) {
    const player = new Player(this, playerId, isMe);
    player.addWizards(_player.wizards);

    this.players.push(player);

    return player;
  }

  addWizardsButtons(wizards) {
    for (let i = 0; i < wizards.length; i++) {
      const wizardButton = this.add
        .image(30, 30 + i * 50, "logo")
        .setScale(0.1);
      wizardButton.id = wizards[i].id;

      wizardButton.setInteractive().on("pointerup", () => {
        // TODO - return if clicked wizard is selected
        //this.player.getSelectedWizardId()

        const action = {
          type: "select",
          ts: Date.now(),
          playerId: this.playerId,
          wizardId: wizardButton.id,
        };

        this.server.handleActionSend(action);

        this.me.setSelectedWizardId(wizardButton.id);
      });
    }
  }

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
