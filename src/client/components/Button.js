export default class Button extends Phaser.GameObjects.Image {
  constructor(scene, x, y, image) {
    super(scene, x, y, image);
    scene.add.existing(this);
    this.scene = scene;

    this.setInteractive();
  }

  onClick(callback) {
    this.on("pointerdown", () => callback());
  }

  addText(text) {
    this.scene.add.text(this.x, this.y, text);
  }
}
