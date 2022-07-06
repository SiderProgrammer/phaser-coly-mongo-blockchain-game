import { Client } from "colyseus.js";
import { SERVER_PORT } from "./config";

export default class Server {
  constructor(playerAccount) {
    this.client = new Client(`ws://localhost:${SERVER_PORT}`);
    this.events = new Phaser.Events.EventEmitter();
    this.playerAccount = playerAccount;
    this.isHUDadded = false;
  }

  async handleWorldJoin() {
    //if (this.challengeRoom) await this.challengeRoom.leave(true);

    this.room = await this.client.joinOrCreate("game", {
      address: this.playerAccount.address,
    });

    this.walletAddress = this.playerAccount.address;
    this.playerId = this.room ? this.room.sessionId : ""; // session id

    //console.log("Room", this.room);
    console.log("Player ID", this.playerId);

    this.room.state.players.onAdd = (player, playerId) => {
      this.events.emit("player-joined", player, playerId);

      if (!this.isHUDadded) {
        // TODO : make it in a better way
        this.events.emit("player-joined-ui", player, playerId); // ? executed in HUD scene
        this.isHUDadded = true;
      }

      player.wizards.forEach((wizard) => {
        wizard.playerId = player.id; // TODO : remove it //? it is needed to find a player owning this wizard
        wizard.onChange = () => {
          this.events.emit("wizard-changed", wizard);
        };
      });
    };
  }

  async handleChallengeJoin(wizardId) {
    await this.room.leave(true);
    //this.room.removeAllListeners();

    this.challengeRoom = await this.client.joinOrCreate("challenge", {
      address: this.playerAccount.address,
      wizardId: wizardId,
    });

    this.events.emit("player-joined-challenge");

    this.challengeRoom.state.onChange = (state) => {
      this.events.emit("challenge-state-changed", state); // TODO : change to state.listen("stateChanged")
    };

    this.challengeRoom.state.wizard.onChange = (changedData) => {
      this.events.emit("player-move-challenge", changedData);
    };
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

  eventExists(event) {
    return this.events.eventNames().some((name) => name === event);
  }

  onPlayerMovedInChallenge(cb, context) {
    if (this.eventExists("player-move-challenge")) return;
    this.events.on("player-move-challenge", cb, context);
  }

  onChallengeStateChanged(cb, context) {
    if (this.eventExists("challenge-state-changed")) return;
    this.events.on("challenge-state-changed", cb, context);
  }

  onPlayerJoinedChallenge(cb, context) {
    if (this.eventExists("player-joined-challenge")) return;
    this.events.on("player-joined-challenge", cb, context);
  }

  onPlayerJoined(cb, context) {
    if (this.eventExists("player-joined")) return;
    this.events.on("player-joined", cb, context);
  }

  onWizardChanged(cb, context) {
    if (this.eventExists("wizard-changed")) return;
    this.events.on("wizard-changed", cb, context);
  }

  onPlayerJoinedUI(cb, context) {
    //  if (this.eventExists("player-joined-ui")) return;
    this.events.on("player-joined-ui", cb, context);
  }
}
