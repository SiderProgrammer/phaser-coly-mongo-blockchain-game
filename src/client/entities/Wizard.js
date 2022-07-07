class Wizard extends Phaser.GameObjects.Sprite {
  // TODO : change this class to a container
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
    this.name = this.scene.add
      .text(this.x, this.y - 50, this.name)
      .setOrigin(0.5);
  }

  update(x, y) {
    this.setPosition(x, y);
    this.name.setPosition(x, y - 50);
  }
}

export default Wizard;
