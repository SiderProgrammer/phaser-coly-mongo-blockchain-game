import { Client } from "colyseus.js";
import {
  CHALLENGE_SCENE,
  GUI_SCENE,
  HUD_SCENE,
  WORLD_SCENE,
} from "../scenes/currentScenes";
import { WEBSOCKET_URL } from "./config";
import { GET_ALL_PLAYERS } from "./requests/requests";

export default class Server {
  constructor(playerAccount, isRegistrationPhase) {
    this.client = new Client(WEBSOCKET_URL);
    this.events = new Phaser.Events.EventEmitter();

    this.activeRoom = "";
    this.playerAccount = playerAccount;
    this.walletAddress = this.playerAccount.address;

    this.isRegistrationPhase = isRegistrationPhase;
  }

  // TODO :  break HUD, GUI, World, Challenge handlers into separate files
  async handleWorldJoin() {
    this.activeRoom = "world";
    //if (this.challengeRoom) await this.challengeRoom.leave(true);
    this.playersSavedState = await (await GET_ALL_PLAYERS()).json(); // ! maybe get players from back-end players state
    this.room = await this.client.joinOrCreate("game", {
      address: this.playerAccount.address,
    });

    this.playerId = this.room ? this.room.sessionId : ""; // ? session id
    this.setWorldListeners();
  }

  async handleChallengeJoin(wizardId) {
    await this.room.leave(true);
    this.activeRoom = "challenge";
    this.challengeRoom = await this.client.joinOrCreate("challenge", {
      address: this.playerAccount.address,
      wizardId: wizardId,
    });

    this.setChallengeListeners();
  }

  setWorldListeners() {
    this.room.state.players.onAdd = this.handleWorldPlayerJoined.bind(this);
    this.room.state.players.onRemove = this.handleWorldPlayerRemoved.bind(this);

    this.room.state.objects.onRemove = (removedObject) => {
      WORLD_SCENE.SCENE.handleObjectRemoved(removedObject);
    };

    this.room.state.listen("wizardsAliveCount", (count) =>
      HUD_SCENE.SCENE.handleUpdate(count, "alive")
    );
    this.room.state.listen("wizardsCount", (count) =>
      HUD_SCENE.SCENE.handleUpdate(count, "all")
    );

    this.room.state.listen("slogan", (newSlogan) =>
      HUD_SCENE.SCENE.updateSlogan(newSlogan)
    );
    this.room.state.listen("day", (newDay) => {
      // if day is changed, it means that the day is refreshed so we can refresh offline wizards
      WORLD_SCENE.SCENE.refreshOfflinePlayers();
      HUD_SCENE.SCENE.updateDay(newDay);
    });
  }

  handleWorldPlayerJoined(player) {
    WORLD_SCENE.SCENE.handlePlayerAdd(player);

    player.wizards.forEach((wizard) => {
      wizard.onChange = (changed) =>
        this.handleWorldWizardChanged(changed, player, wizard);

      wizard.collectedObjectsCount.forEach(
        (obj) =>
          (obj.onChange = () => this.handleCollectedObjectsChanged(obj, player))
      );
    });
  }
  handleWorldPlayerRemoved(player) {
    WORLD_SCENE.SCENE.handlePlayerRemove(player);
  }
  handleWorldWizardChanged(changed, player, wizard) {
    if (
      changed.find(
        (change) =>
          change.field === "isAlive" ||
          change.field === "dailyChallengeCompleted"
      ) &&
      this.isMyID(player.id)
    ) {
      GUI_SCENE.SCENE.handleUpdate(wizard);
    }

    if (
      changed.find((change) => change.field === "movesLeft") &&
      this.isMyID(player.id)
    ) {
      HUD_SCENE.SCENE.updateMovesLeft(wizard);
    }

    WORLD_SCENE.SCENE.handleWizardChanged(wizard, player.id);
  }

  handleCollectedObjectsChanged(obj, player) {
    if (this.isMyID(player.id)) {
      HUD_SCENE.SCENE.updateCollectedObjects(obj);
    }
  }

  setChallengeListeners() {
    this.challengeRoom.state.onChange = (state) => {
      if (
        state.find(
          (change) =>
            change.field === "isChallengeStarted" && change.value === true
        )
      ) {
        CHALLENGE_SCENE.SCENE.handlePlayerAdd();
      }

      CHALLENGE_SCENE.SCENE.handleChangeState(state);
    };

    this.challengeRoom.state.wizard.onChange = (changedData) => {
      CHALLENGE_SCENE.SCENE.handlePlayerMoved(changedData);
    };
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
