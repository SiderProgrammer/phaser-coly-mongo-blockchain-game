import { CREATE_PLAYER, GET_PLAYER } from "../services/requests/requests";
import Server from "../services/Server";

export default class Bootstrap extends Phaser.Scene {
  constructor() {
    super("bootstrap");
  }

  preload() {
    this.load.image("logo", "./src/client/assets/logo.png");
  }

  async create() {
    this.playerAccount = {};
    const address = (Math.random() * 100).toString(); //  wallet address
    //  ! we'll need to generate JW token or something else so users can't change their address from client-side and cheat

    this.playerAccount = await GET_PLAYER({ address });

    if (!this.playerAccount.ok) {
      this.playerAccount = await CREATE_PLAYER({ address });
    }
    this.playerAccount = await this.playerAccount.json();

    this.server = new Server(this.playerAccount);
    await this.server.handleWorldJoin();
    this.createNewGame(true);
    this.createWizardsHUD();
  }

  createWizardsHUD() {
    this.scene.launch("hud", {
      server: this.server,
    });
  }

  async createNewGame(joinServer) {
    //joinServer && (await this.server.handleWorldJoin());

    this.scene.launch("world", {
      server: this.server,
      onPlayChallenge: this.onPlayChallenge.bind(this),
      joinServer: joinServer,
    });
  }

  async onPlayChallenge(wizardId) {
    console.log("challenge started!");

    this.scene.stop("world");
    this.scene.launch("challenge", {
      server: this.server,
      onLoseChallenge: this.onLoseChallenge.bind(this),
      onWinChallenge: this.onWinChallenge.bind(this),
    });

    await this.server.handleChallengeJoin(wizardId);
  }

  async onLoseChallenge() {
    console.log("Lose challenge");

    await this.server.handleWorldJoin();

    this.scene.stop("challenge");
    this.createNewGame(false);
  }

  async onWinChallenge() {
    console.log("Win challenge");

    await this.server.handleWorldJoin();

    this.scene.stop("challenge");
    this.createNewGame(false);
  }
}
