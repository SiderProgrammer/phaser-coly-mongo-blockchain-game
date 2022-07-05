import { Client } from "colyseus.js";
import { SERVER_PORT } from "./config";
import { CREATE_PLAYER, GET_PLAYER } from "./requests/requests";

export default class Server {
  constructor(playerAccount) {
    this.client = new Client(`ws://localhost:${SERVER_PORT}`);
    this.events = new Phaser.Events.EventEmitter();
    this.playerAccount = playerAccount;
  }

  async join() {
    await this.handleWorldJoin();
  }

  async handleWorldJoin() {
    this.room = await this.client.joinOrCreate("game", {
      address: this.playerAccount.address,
    });

    this.playerId = this.playerAccount.address; // this.room ? this.room.sessionId : "";

    //console.log("Room", this.room);
    console.log("Player ID", this.playerId);

    this.room.state.players.onAdd = (player, playerId) => {
      this.events.emit("player-joined", player, playerId);
      this.events.emit("player-joined-ui", player, playerId);

      player.wizards.forEach((wizard) => {
        wizard.ownerId = player.id; // ? it is needed to find a player owning this wizard
        wizard.onChange = () => {
          this.events.emit("wizard-changed", wizard);
        };
      });
    };

    // this.room.onMessage("change-room", async ({ roomName }) => {
    //   if (roomName === "challenge") {
    //     this.handleChallengeJoin();
    //   }
    // });
  }

  async handleChallengeJoin(wizardId) {
    await this.room.leave(true);
    this.room.removeAllListeners();

    this.challengeRoom = await this.client.joinOrCreate("challenge", {
      address: this.playerAccount.address,
      wizardId: wizardId,
    });

    this.events.emit("player-joined-challenge");

    this.challengeRoom.state.onChange = (state) => {
      this.events.emit("challenge-state-changed", state); // TODO - change to state.listen("stateChanged")
    };

    this.challengeRoom.state.wizard.onChange = (changedData) => {
      this.events.emit("player-move-challenge", changedData);
    };

    this.challengeRoom.onMessage("change-room", async ({ roomName }) => {
      if (roomName === "world") {
        this.challengeRoom.leave();
        //this.handleWorldJoin();
      }
    });
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

  onChallengeStateChanged(cb, context) {
    this.events.on("challenge-state-changed", cb, context);
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

  onPlayerJoinedUI(cb, context) {
    this.events.on("player-joined-ui", cb, context);
  }
}
