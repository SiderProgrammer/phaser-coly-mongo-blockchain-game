import Server from "../services/Server";

export default class Bootstrap extends Phaser.Scene {
  constructor() {
    super("bootstrap");
  }

  init() {
    this.server = new Server();
  }

  create() {
    this.createNewGame(true);
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
    this.createNewGame(false);
  }

  onWinChallenge() {
    console.log("Win challenge");
    this.scene.stop("challenge");
    this.createNewGame(false);
  }
}
