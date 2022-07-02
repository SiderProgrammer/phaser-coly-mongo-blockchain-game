import { Client } from "colyseus.js";

export default class Server {
  constructor() {
    this.client = new Client("ws://localhost:8080");
    this.events = new Phaser.Events.EventEmitter();
  }

  async join() {
    this.room = await this.client.joinOrCreate("game", {
      playerName: "testAccount",
    });

    this.playerId = this.room ? this.room.sessionId : "";

    console.log("Room", this.room);
    console.log("Player ID", this.playerId);

    this.room.state.players.onAdd = (player, playerId) => {
      this.events.emit("player-joined", player, playerId);

      player.wizards.forEach((wizard) => {
        wizard.ownerId = player.id; // ? needed to find a player owning this wizard
        wizard.onChange = () => {
          this.events.emit("wizard-changed", wizard);
        };
      });
    };

    this.room.onMessage("change-room", async ({ roomName }) => {
      this.room.leave();
      this.challengeRoom = await this.client.joinOrCreate(roomName);

      this.events.emit("player-joined-challenge");

      this.challengeRoom.state.player.onChange = (player, playerId) => {
        this.events.emit("player-move-challenge");
        console.log("change");
      };
    });

    // this.room.state.onChange = (changes) => {
    //   changes.forEach((change) => {
    //     // console.log(change);
    //   });
    // };

    // this.room.onMessage("*", (type, message) =>
    //   this.handleMessage(type, message)
    // );
  }

  getPlayerId() {
    return this.playerId;
  }

  handleActionSend(action) {
    if (!this.room) {
      return;
    }

    this.room.send(action.type, action);
  }

  handleActionSendInChallenge(action) {
    if (!this.challengeRoom) {
      return;
    }
    this.challengeRoom.send(action.type, action);
  }

  onPlayerMovedInChallenge(cb, context) {
    this.events.on("player-move-challenge", cb, context);
  }

  onPlayerJoinedChallenge(cb, context) {
    this.events.on("player-joined-challenge", cb, context);
  }

  onPlayerJoined(cb, context) {
    this.events.on("player-joined", cb, context);
  }

  onWizardChanged(cb, context) {
    this.events.on("wizard-changed", cb, context);
  }
}
