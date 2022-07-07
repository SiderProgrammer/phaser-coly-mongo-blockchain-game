import { Client } from "colyseus.js";
import { SERVER_PORT } from "./config";

export default class Server {
  constructor(playerAccount) {
    this.client = new Client(`ws://localhost:${SERVER_PORT}`);
    this.events = new Phaser.Events.EventEmitter();

    this.playerAccount = playerAccount;
    this.isHUDadded = false;
    this.walletAddress = this.playerAccount.address;
  }

  // TODO : change events names && break HUD, World, Challenge handlers into separate files
  async handleWorldJoin() {
    //if (this.challengeRoom) await this.challengeRoom.leave(true);

    this.room = await this.client.joinOrCreate("game", {
      address: this.playerAccount.address,
    });

    this.playerId = this.room ? this.room.sessionId : ""; // ? session id

    this.room.state.players.onAdd = (player, playerId) => {
      this.events.emit("player-joined", player);

      if (playerId === this.playerId) {
        this.handleAddHUD(player);
      }

      player.wizards.forEach((wizard) => {
        wizard.onChange = () => {
          this.events.emit("wizard-changed", wizard, player.id);
        };
      });
    };
  }

  async handleChallengeJoin(wizardId) {
    await this.room.leave(true);

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

  handleAddHUD(player) {
    if (!this.isHUDadded) {
      // TODO : make it in a better way
      this.events.emit("player-joined-ui", player, player.id); // ? callback in HUD scene
      this.isHUDadded = true;
    } else {
      this.events.emit("player-update-ui", player, player.id); // ? callback in HUD scene
    }
  }

  handleActionSend(action) {
    if (!this.room) {
      return;
    }

    this.room.send(action.type, action);
  }

  getPlayerWalletAddress() {
    return this.walletAddress;
  }

  getPlayerId() {
    return this.playerId;
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

  // ! WORLD EVENTS
  onPlayerJoined(cb, context) {
    if (this.eventExists("player-joined")) return;
    this.events.on("player-joined", cb, context);
  }

  onWizardChanged(cb, context) {
    if (this.eventExists("wizard-changed")) return;
    this.events.on("wizard-changed", cb, context);
  }

  // ! CHALLENGE EVENTS
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

  // ! UI EVENTS

  onPlayerJoinedUI(cb, context) {
    //  if (this.eventExists("player-joined-ui")) return;
    this.events.on("player-joined-ui", cb, context);
  }

  onPlayerUpdateUI(cb, context) {
    //  if (this.eventExists("player-joined-ui")) return;
    this.events.on("player-update-ui", cb, context);
  }
}
