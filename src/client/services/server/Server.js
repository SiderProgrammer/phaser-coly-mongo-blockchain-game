import { Client } from "colyseus.js";
import { WEBSOCKET_URL } from "./config";
import { GET_ALL_PLAYERS } from "./requests/requests";
import WorldServerManager from "./world";

export default class Server {
  constructor(playerAccount) {
    this.client = new Client(WEBSOCKET_URL);
    //this.events = new Phaser.Events.EventEmitter();

    this.playerAccount = playerAccount;
    this.walletAddress = this.playerAccount.address;

    this.worldServerManager = new WorldServerManager();
  }

  // TODO : change events names && break HUD, World, Challenge handlers into separate files
  async handleWorldJoin() {
    //if (this.challengeRoom) await this.challengeRoom.leave(true);
    this.playersSavedState = await (await GET_ALL_PLAYERS()).json(); // ! maybe get players from back-end players state
    this.room = await this.client.joinOrCreate("game", {
      address: this.playerAccount.address,
    });
    this.worldServerManager.setRoom(this.room);

    this.playerId = this.room ? this.room.sessionId : ""; // ? session id

    this.room.state.players.onAdd = this.handleWorldPlayerJoined.bind(this);

    this.room.state.objects.onRemove = (removedObject) => {
      this.worldServerManager.events.emit("object-removed", removedObject);
    };

    this.room.state.listen("wizardsAliveCount", (count) =>
      this.HudServerManager.events.emit("update", count, "alive")
    );
    this.room.state.listen("wizardsCount", (count) =>
      this.HudServerManager.events.emit("update", count, "all")
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

  handleWorldPlayerJoined(player) {
    this.worldServerManager.events.emit("player-joined", player);

    if (this.isMyID(player.id)) {
      this.guiServerManager.events.emit("update", player);
    }

    player.wizards.forEach((wizard) => {
      wizard.onChange = handleWorldWizardChanged.bind(this, player, wizard);
    });
  }

  handleWorldWizardChanged(changed, player, wizard) {
    if (
      changed.find((change) => change.field === "isAlive") &&
      this.isMyID(player.id)
    ) {
      this.guiServerManager.events.emit("update", player);
    }

    if (
      changed.find((change) => change.field === "collectedObjectsCount") &&
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
  }

  updateSlogan() {
    this.serverHudManager.events.emit("update-hud-slogan");
  }

  isMyID(id) {
    return this.playerId === id;
  }

  getPlayerWalletAddress() {
    return this.walletAddress;
  }

  getPlayerId() {
    return this.playerId;
  }
}
