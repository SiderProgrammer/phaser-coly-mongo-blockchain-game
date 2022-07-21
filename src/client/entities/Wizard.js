class Wizard extends Phaser.GameObjects.Sprite {
  // TODO : change this class to a container
  constructor(id, scene, x, y, sprite, name) {
    super(scene, x, y, sprite);
    scene.add.existing(this);
    this.scene = scene;
    this.name = name;
    this.id = id;
    this.isAlive = true;
    this.canMove = true;
    this.lastPreMove = {};
    this.moveTween = null;

    this.showName();
    this.on("animationcomplete", () => this.play("idle"));
  }

  kill() {
    this.isAlive = false;
    this.setAlpha(0.3);
  }

  setName(name) {
    this.name.setText(name);
  }

  showName() {
    this.name = this.scene.add
      .text(this.x, this.y - 50, this.name)
      .setOrigin(0.5);
  }

  preMove(dir, distance) {
    const speedX = distance * dir.x;
    const speedY = distance * dir.y;

    this.lastPreMove = {
      speedX,
      speedY,
    };
    this.x += speedX;
    this.y += speedY;
  }

  reversePreMove() {
    this.x -= this.lastPreMove.speedX;
    this.y -= this.lastPreMove.speedY;
  }

  playWalkAnimation(dir) {
    if (dir.x === -1) {
      this.play("walk-left");
    }
    if (dir.x === 1) {
      this.play("walk-right");
    }
    if (dir.y === -1) {
      this.play("walk-up");
    }
    if (dir.y === 1) {
      this.play("walk-down");
    }
  }

  walkTo(x, y) {
    this.scene.tweens.add({
      // TODO : we should keep walk animation on hold until server respawn
      targets: [this, this.name],
      x: x,
      y: y,
      duration: 1000,
      onUpdate: () => (this.name.y = this.y - 50), // TODO : handle it better / create container
      onComplete: () => (this.canMove = true),
    });
  }

  update(x, y) {
    this.setPosition(x, y);
    this.name.setPosition(x, y - 50);
  }
}

export default Wizard;
