class Wizard extends Phaser.GameObjects.Sprite {
  constructor(id, scene, x, y, sprite) {
    super(scene, x, y, sprite);
    scene.add.existing(this);

    this.id = id;
  }
}

export default Wizard;
