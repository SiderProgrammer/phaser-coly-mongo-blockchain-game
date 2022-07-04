class Wizard extends Phaser.GameObjects.Sprite {
  constructor(id, scene, x, y, sprite, name) {
    super(scene, x, y, sprite);
    scene.add.existing(this);
    this.scene = scene;
    this.name = name;
    this.id = id;
    this.isAlive = true;
    this.showName();
  }

  kill() {
    this.isAlive = false;
    this.setAlpha(0.3);
  }

  showName() {
    this.scene.add.text(this.x, this.y - 50, this.name).setOrigin(0.5);
  }
}

export default Wizard;
