import { calculateRegistrationPhaseRemainingTime } from "../../shared/utils";
import initPlayerAnims from "../anim/player";

import {
  CREATE_PLAYER,
  GET_GAME_STATE,
  GET_PLAYER,
} from "../services/requests/requests";
import Server from "../services/Server";

export default class Bootstrap extends Phaser.Scene {
  constructor() {
    super("bootstrap");
  }

  async create() {
    this.playerAccount = {};
    const address = window.walletAddress;
    // ! we'll need to generate JW token or something else so users can't change their address from client-side and cheat

    this.playerAccount = await GET_PLAYER({ address });

    if (!this.playerAccount.ok) {
      this.playerAccount = await CREATE_PLAYER({ address });
    }

    this.playerAccount = await this.playerAccount.json();

    if (this.playerAccount.error) {
      // Registration phase is finished
      this.add
        .text(500, 300, this.playerAccount.error, { font: "50px Arial" })
        .setOrigin(0.5, 0.5);

      return;
    }
    const timeDifference = Date.now();
    this.gameState = await (await GET_GAME_STATE()).json();
    this.gameState.timeDifference = Date.now() - timeDifference;

    const isRegistrationPhase =
      calculateRegistrationPhaseRemainingTime(this.gameState) > 0;

    this.server = new Server(this.playerAccount, isRegistrationPhase);

    this.initAnimations();
    this.createNewGame();
    this.createGUI();
    this.createHUD();
  }

  createHUD() {
    this.scene.launch("hud", {
      server: this.server,
      gameState: this.gameState, // TODO : move to server class
    });

    this.scene.bringToTop("hud");
  }
  createGUI() {
    this.scene.launch("gui", {
      server: this.server,
      gameState: this.gameState, // TODO : move to server class
      player: this.playerAccount,
    });

    this.scene.bringToTop("gui");
  }

  async createNewGame() {
    this.scene.launch("world", {
      server: this.server,
      onPlayChallenge: this.onPlayChallenge.bind(this),
      gameState: this.gameState, // TODO : move to server class
    });

    console.log("World created!");
  }

  async onPlayChallenge(wizardId) {
    this.scene.stop("world");
    this.scene.launch("challenge", {
      server: this.server,
      onLoseChallenge: this.onLoseChallenge.bind(this),
      onWinChallenge: this.onWinChallenge.bind(this),
      wizardId,
    });

    console.log("Challenge started!");
  }

  async onLoseChallenge() {
    this.scene.stop("challenge");
    this.createNewGame();

    console.log("Challenge lost");
  }

  async onWinChallenge() {
    this.scene.stop("challenge");
    this.createNewGame();

    console.log("Challenge won");
  }

  initAnimations() {
    initPlayerAnims(this);
  }
}
