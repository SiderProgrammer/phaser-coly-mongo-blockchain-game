import { TILE_SIZE } from "../../shared/config";

class Wizard extends Phaser.GameObjects.Sprite {
  // TODO : change this class to a container
  constructor(id, scene, r, c, sprite, name, isMe) {
    super(
      scene,
      c * TILE_SIZE + TILE_SIZE / 2,
      r * TILE_SIZE + TILE_SIZE / 2,
      sprite
    );

    scene.add.existing(this);

    this.scene = scene;
    this.name = name;
    this.id = id;
    this.r = r;
    this.c = c;
    this.isAlive = true;
    this.canMove = true;
    this.lastPreMove = {};
    this.moveTween = null;
    this.preMoveDir = {};

    this.movesLeft = 0;
    this.collectedObjects = {
      1: -1,
      2: -1,
      3: -1,
    };

    this.showName();

    this.on("animationcomplete", ({ key }) => {
      if (!key.includes("pre") && !isMe) this.play("idle");
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
      targets: [this, this.name],
      x: `+=${speedX}`,
      y: `+=${speedY}`,
      duration: 250,
      onUpdate: () => (this.name.y = this.y - 50), // TODO : handle it better
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
  getMoveDirByTargetPos(targetR, targetC) {
    const dir = {
      x: 0,
      y: 0,
    };

    if (targetC > this.c) dir.x = 1;
    if (targetC < this.c) dir.x = -1;
    if (targetR > this.r) dir.y = 1;
    if (targetR < this.r) dir.y = -1;

    return dir;
  }
  walkTo(r, c) {
    const dir = this.getMoveDirByTargetPos(r, c);

    this.playWalkAnimation(dir);
    this.r = r;
    this.c = c;

    this.scene.tweens.add({
      targets: [this, this.name],
      x: c * TILE_SIZE + TILE_SIZE / 2,
      y: r * TILE_SIZE + TILE_SIZE / 2,
      duration: 500,
      onUpdate: () => (this.name.y = this.y - 50), // TODO : handle it better / create container
      onComplete: () => {
        this.canMove = true;
        // this.scene.isWorld && // TODO: move it in a scene file
        //   this.scene.mapGridManager.addWizardToGrid(this);
      },
    });
  }

  // update(x, y) {
  //   this.setPosition(x, y);
  //   this.name.setPosition(x, y - 50);
  // }
}

export default Wizard;
