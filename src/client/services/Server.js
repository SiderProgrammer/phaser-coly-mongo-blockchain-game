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
    this.setWorldListeners();
  }

  async handleChallengeJoin(wizardId) {
    await this.room.leave(true);

    this.challengeRoom = await this.client.joinOrCreate("challenge", {
      address: this.playerAccount.address,
      wizardId: wizardId,
    });

    CHALLENGE_SCENE.SCENE.handlePlayerAdd();

    this.setChallengeListeners();
  }

  setWorldListeners() {
    this.room.state.players.onAdd = this.handleWorldPlayerJoined.bind(this);

    this.room.state.objects.onRemove = (removedObject) => {
      WORLD_SCENE.SCENE.handleObjectRemoved(removedObject);
    };

    this.room.state.listen("wizardsAliveCount", (count) =>
      HUD_SCENE.SCENE.handleUpdate(count, "alive")
    );
    this.room.state.listen("wizardsCount", (count) =>
      HUD_SCENE.SCENE.handleUpdate(count, "all")
    );
  }

  handleWorldPlayerJoined(player) {
    WORLD_SCENE.SCENE.handlePlayerAdd(player);

    if (this.isMyID(player.id)) {
      GUI_SCENE.SCENE.handleUpdate(player);
    }

    player.wizards.forEach((wizard) => {
      wizard.onChange = (changed) =>
        this.handleWorldWizardChanged(changed, player, wizard);
    });
  }

  handleWorldWizardChanged(changed, player, wizard) {
    // TODO: handle it in a better way

    if (
      changed.find((change) => change.field === "isAlive") &&
      this.isMyID(player.id)
    ) {
      GUI_SCENE.SCENE.handleUpdate(player);
    }

    if (
      changed.find((change) => change.field === "collectedObjectsCount") &&
      this.isMyID(player.id)
    ) {
      console.log(chamge);
      HUD_SCENE.SCENE.updateCollectedObjects(
        wizard.collectedObjectsCount,
        changed.find((change) => change.field === "id")
          ? changed.find((change) => change.field === "id").value
          : null
      );
    }

    WORLD_SCENE.SCENE.handleWizardChanged(wizard, player.id);
  }

  setChallengeListeners() {
    this.challengeRoom.state.onChange = (state) => {
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

  updateSlogan() {
    HUD_SCENE.SCENE.updateSlogan();
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
