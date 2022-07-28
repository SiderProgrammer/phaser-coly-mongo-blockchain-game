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
    this.preMoveDir = {};

    this.collectedObjects = {
      1: -1,
      2: -1,
      3: -1,
    };

    this.showName();
    this.on("animationcomplete", ({ key }) => {
      if (!key.includes("pre")) this.play("idle");
    });
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
  reversePreMove() {
    this.playPreWalkAnimation(this.preMoveDir, true);
    this.scene.tweens.add({
      // TODO : we should keep walk animation on hold until server respawn
      targets: [this, this.name],
      x: `-=${this.lastPreMove.speedX}`,
      y: `-=${this.lastPreMove.speedY}`,
      duration: 250,
      onUpdate: () => (this.name.y = this.y - 50), // TODO : handle it better / create container
      onComplete: () => {
        this.canMove = true;
        this.play("idle");
      },
    });
  }
  // TODO : handle movement & animations in a better way
  playPreWalkAnimation(dir, reverse = false) {
    if (dir.x === -1) {
      if (reverse) {
        this.play("pre-walk-left");
      } else {
        this.playReverse("pre-walk-left");
      }
    }
    if (dir.x === 1) {
      if (reverse) {
        this.play("pre-walk-right");
      } else {
        this.playReverse("pre-walk-right");
      }
    }
    if (dir.y === -1) {
      if (reverse) {
        this.play("pre-walk-up");
      } else {
        this.playReverse("pre-walk-up");
      }
    }
    if (dir.y === 1) {
      if (reverse) {
        this.play("pre-walk-down");
      } else {
        this.playReverse("pre-walk-down");
      }
    }
  }

  preMove(dir, distance, callback) {
    const speedX = distance * dir.x;
    const speedY = distance * dir.y;

    this.lastPreMove = {
      speedX,
      speedY,
    };
    this.preMoveDir = dir;

    this.playPreWalkAnimation(dir);

    this.scene.tweens.add({
      // TODO : we should keep walk animation on hold until server respawn
      targets: [this, this.name],
      x: `+=${speedX}`,
      y: `+=${speedY}`,
      duration: 250,
      onUpdate: () => (this.name.y = this.y - 50), // TODO : handle it better / ,
      onComplete: () => callback && callback(),
    });
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
  getMoveDirByTargetPos(targetX, targetY) {
    const dir = {
      x: 0,
      y: 0,
    };

    if (targetX > this.x) dir.x = 1;
    if (targetX < this.x) dir.x = -1;
    if (targetY > this.y) dir.y = 1;
    if (targetY < this.y) dir.y = -1;

    return dir;
  }
  walkTo(x, y) {
    const dir = this.getMoveDirByTargetPos(x, y);
    this.playWalkAnimation(dir);

    this.scene.tweens.add({
      targets: [this, this.name],
      x: x,
      y: y,
      duration: 500,
      onUpdate: () => (this.name.y = this.y - 50), // TODO : handle it better / create container
      onComplete: () => {
        this.canMove = true;
        this.scene.mapGridManager &&
          this.scene.mapGridManager.addWizardToGrid(this);
      },
    });
  }
  update(x, y) {
    this.setPosition(x, y);
    this.name.setPosition(x, y - 50);
  }
}

export default Wizard;
