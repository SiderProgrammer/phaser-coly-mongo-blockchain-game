class Challenge extends Phaser.Scene {
  constructor() {
    super("challenge");
  }

  create() {
    this.add.image(200, 200, "logo");
    console.log("s");
  }
}

export default Challenge;
