import { CREATE_PLAYER, GET_PLAYER } from "../services/requests/requests";
import Server from "../services/Server";

export default class Bootstrap extends Phaser.Scene {
  constructor() {
    super("bootstrap");
  }

  async create() {
    this.playerAccount = {};
    const address = (Math.random() * 100).toString(); // wallet address

    this.playerAccount = await GET_PLAYER({ address });

    if (!this.playerAccount.ok) {
      this.playerAccount = await CREATE_PLAYER({ address });
    }
    this.playerAccount = await this.playerAccount.json();

    this.server = new Server(this.playerAccount);

    this.createWizardsHUD();
    this.createNewGame(true);
  }

  createWizardsHUD() {
    this.scene.launch("hud", {
      server: this.server,
    });
  }

  createNewGame(joinServer) {
    this.scene.launch("world", {
      server: this.server,
      onPlayChallenge: this.onPlayChallenge.bind(this),
      joinServer: joinServer,
    });
  }

  onPlayChallenge() {
    console.log("challenge started!");

    this.scene.stop("world");
    this.scene.launch("challenge", {
      server: this.server,
      onLoseChallenge: this.onLoseChallenge.bind(this),
      onWinChallenge: this.onWinChallenge.bind(this),
    });
  }

  onLoseChallenge() {
    console.log("Lose challenge");
    this.scene.stop("challenge");
    this.createNewGame(true);
  }

  onWinChallenge() {
    console.log("Win challenge");
    this.scene.stop("challenge");
    this.createNewGame(true);
  }
}
