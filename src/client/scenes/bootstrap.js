import Server from "../services/Server";

export default class Bootstrap extends Phaser.Scene {
  constructor() {
    super("bootstrap");
  }

  init() {
    this.server = new Server();
  }

  create() {
    this.scene.launch("world", {
      server: this.server,
      onPlayChallenge: this.onPlayChallenge.bind(this),
    });
  }

  onPlayChallenge() {
    console.log("challenge started!");

    this.scene.launch("challenge");
    this.scene.bringToTop("challenge");
  }
}
