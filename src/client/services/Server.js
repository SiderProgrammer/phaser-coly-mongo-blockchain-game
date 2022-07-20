import { Client } from "colyseus.js";
import { WEBSOCKET_URL } from "./config";
import { GET_ALL_PLAYERS } from "./requests/requests";

export default class Server {
  constructor(playerAccount) {
    this.client = new Client(WEBSOCKET_URL);
    this.events = new Phaser.Events.EventEmitter();

    this.playerAccount = playerAccount;
    this.walletAddress = this.playerAccount.address;
  }

  // TODO : change events names && break HUD, World, Challenge handlers into separate files
  async handleWorldJoin() {
    //if (this.challengeRoom) await this.challengeRoom.leave(true);
    this.playersSavedState = await (await GET_ALL_PLAYERS()).json(); // ! maybe get players from back-end players state
    this.room = await this.client.joinOrCreate("game", {
      address: this.playerAccount.address,
    });

    this.playerId = this.room ? this.room.sessionId : ""; // ? session id

    this.room.state.players.onAdd = (player, playerId) => {
      this.events.emit("player-joined", player);

      if (this.isMyID(player.id)) {
        this.events.emit("update-gui", player);
      }

      player.wizards.forEach((wizard) => {
        wizard.onChange = (changed) => {
          if (
            changed.find((change) => change.field === "isAlive") &&
            this.isMyID(player.id)
          ) {
            this.events.emit("update-gui", player);
          }

          if (
            changed.find(
              (change) => change.field === "collectedObjectsCount"
            ) &&
            this.isMyID(player.id)
          ) {
            this.events.emit(
              "update-hud-objects",
              wizard.collectedObjectsCount,
              changed.find((change) => change.field === "id")
                ? changed.find((change) => change.field === "id").value
                : null
            );
          }
     
          this.events.emit("wizard-changed", wizard, player.id); // ? it handles wizards x,y,alive states
        };
      });
    };

    this.room.state.objects.onRemove = (removedObject) => {
      this.events.emit("object-removed", removedObject);
    };

    this.room.state.listen("wizardsAliveCount", (count) =>
      this.events.emit("update-hud", count, "alive")
    );
    this.room.state.listen("wizardsCount", (count) =>
      this.events.emit("update-hud", count, "all")
    );
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

  updateSlogan() {
    this.events.emit("update-hud-slogan");
  }

  isMyID(id) {
    return this.playerId === id;
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
  onObjectRemoved(cb, context) {
    if (this.eventExists("object-removed")) return;
    this.events.on("object-removed", cb, context);
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

  onUpdateGUI(cb, context) {
    if (this.eventExists("update-gui")) return;
    this.events.on("update-gui", cb, context);
  }

  onUpdateHUD(cb, context) {
    if (this.eventExists("update-hud")) return;

    this.events.on("update-hud", cb, context);
  }
  onUpdateHUDobjects(cb, context) {
    if (this.eventExists("update-hud-objects")) return;

    this.events.on("update-hud-objects", cb, context);
  }

  onUpdateSlogan(cb, context) {
    if (this.eventExists("update-hud-slogan")) return;

    this.events.on("update-hud-slogan", cb, context);
  }
}
