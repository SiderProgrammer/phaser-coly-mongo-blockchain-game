import { CREATE_PLAYER, GET_PLAYER } from "../services/requests/requests";
import Server from "../services/Server";

export default class Bootstrap extends Phaser.Scene {
  constructor() {
    super("bootstrap");
  }

  preload() {
    this.load.setPath("./src/client/assets/");
    this.load.image("logo", "logo.png");
    this.load.image("green", "green.png");
    this.load.image("red", "red.png");
    this.load.image("white", "white.png");
    this.load.image("wizard", "wizard.png");
    this.load.image("challengeButton", "challengeButton.png");

    // this.load.tilemapTiledJSON("worldMap", `tilemaps/sampleMap.json`);
    // this.load.image("tiles32x32", `tilesets/tiles32x32.png`);
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

    this.server = new Server(this.playerAccount);

    this.createNewGame();
    this.createWizardsHUD();
  }

  createWizardsHUD() {
    this.scene.launch("hud", {
      server: this.server,
    });

    this.scene.bringToTop("hud");
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
}
