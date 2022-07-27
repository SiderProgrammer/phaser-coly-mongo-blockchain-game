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
    const address = window.walletAddress; // (Math.random() * 100).toString();
    // ? random generated wallet address for development purpose (later it will be real wallet address)
    // ! we'll need to generate JW token or something else so users can't change their address from client-side and cheat

    this.playerAccount = await GET_PLAYER({ address });

    if (!this.playerAccount.ok) {
      this.playerAccount = await CREATE_PLAYER({ address });
    }
    this.playerAccount = await this.playerAccount.json();

    this.gameState = await (await GET_GAME_STATE()).json(); // TODO : move to server-side

    this.server = new Server(this.playerAccount);

    this.initAnimations();
    this.createNewGame();
    this.createGUI();
    this.createHUD();
  }

  createHUD() {
    this.scene.launch("hud", {
      server: this.server,
      gameState: this.gameState,
    });

    this.scene.bringToTop("hud");
  }

  createGUI() {
    this.scene.launch("gui", {
      server: this.server,
      gameState: this.gameState,
      player: this.playerAccount,
    });

    this.scene.bringToTop("gui");
  }

  async createNewGame() {
    this.scene.launch("world", {
      server: this.server,
      onPlayChallenge: this.onPlayChallenge.bind(this),
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
