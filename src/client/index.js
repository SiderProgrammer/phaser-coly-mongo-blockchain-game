import Phaser from "phaser";
import { Client, Room } from "colyseus.js";

class MyGame extends Phaser.Scene {
  constructor() {
    super();
    // const host = window.document.location.host.replace(/:.*/, '');
    // const port = process.env.NODE_ENV !== 'production' ? Constants.WS_PORT : window.location.port;
    // const url = `${window.location.protocol.replace('http', 'ws')}//${host}${port ? `:${port}` : ''}`;
    this.client = new Client("ws://localhost:8080");
  }

  preload() {
    this.load.image("logo", "./src/client/assets/logo.png");
  }

  async create() {
    this.add.image(400, 200, "logo").setScale(0.2); // test obstacle
    this.room = await this.client.joinOrCreate("game", {
      playerName: "testAccount",
    });
    this.playerId = this.room ? this.room.sessionId : "";
    this.players = [];
    console.log("Room", this.room);
    console.log("Player ID", this.playerId);

    this.room.state.players.onAdd = (player, playerId) =>
      this.handlePlayerAdd(player, playerId);

    // ! TODO - update player position
    this.room.state.onChange = (changes) => {
      changes.forEach((change) => {
        console.log(change);
      });
    };

    this.room.onMessage("*", (type, message) =>
      this.handleMessage(type, message)
    );

    this.cursors = this.input.keyboard.createCursorKeys();
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
          playerId: this.me.playerId,
          dir,
        };
        // Send the action to the server
        this.handleActionSend(action);
      }
    }
  }

  isPlayerIdMe(playerId) {
    return playerId === this.playerId;
  }

  handlePlayerAdd(player, playerId) {
    console.log("Player added", player, playerId);

    const isMe = this.isPlayerIdMe(playerId);
    this.playerAdd(playerId, player, isMe);
    this.updateRoom();

    player.onChange = () => {
      this.handlePlayerUpdate(player, playerId);
    };
  }

  handlePlayerUpdate(player, playerId) {
    const isMe = this.isPlayerIdMe(playerId);
    this.playerUpdate(playerId, player, isMe);
  }

  playerUpdate(playerId, player, isMe) {
    //console.log(player.x, player.y);
    const me = this.me; // this.room.state.players.get(playerId);

    me.x = player.x;
    me.y = player.y;
  }

  playerAdd(playerId, player, isMe) {
    const character = this.add.image(player.x, player.y, "logo").setScale(0.2);
    character.playerId = playerId;

    if (isMe) {
      this.me = character;
    } else {
      this.players.push(character);
    }
  }

  handleMessage(type, message) {
    console.log(type, message);
    switch (type) {
      case "waiting":
        announce = `Waiting for other players...`;
        break;
      case "start":
        announce = `Game starts`;
        break;
      case "won":
        announce = `${message.params.name} wins!`;
        break;
      case "timeout":
        announce = `Timeout...`;
        break;
      default:
        break;
    }

    this.updateRoom();
  }

  updateRoom() {}

  handleActionSend(action) {
    if (!this.room) {
      return;
    }

    this.room.send(action.type, action);
  }
}

const config = {
  type: Phaser.AUTO,
  parent: "phaser-example",
  width: 800,
  height: 600,
  scale: {
    mode: Phaser.Scale.FIT,
  },
  scene: MyGame,
};

const game = new Phaser.Game(config);
