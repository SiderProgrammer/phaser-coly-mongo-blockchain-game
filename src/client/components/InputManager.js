export default class InputManager {
  constructor(scene) {
    this.scene = scene;

    this.keys = scene.input.keyboard.addKeys(
      "W, A, S, D, LEFT, RIGHT, UP, DOWN"
    );
  }

  update() {
    const dir = {
      x: 0,
      y: 0,
    };

    if (this.keys.A.isDown || this.keys.LEFT.isDown) {
      dir.x -= 1;
    }

    if (this.keys.D.isDown || this.keys.RIGHT.isDown) {
      dir.x += 1;
    }

    if (dir.x === 0) {
      // prevent diagonally movement
      if (this.keys.W.isDown || this.keys.UP.isDown) {
        dir.y -= 1;
      }

      if (this.keys.S.isDown || this.keys.DOWN.isDown) {
        dir.y += 1;
      }
    }

    if (dir.x === 0 && dir.y === 0) return;

    this.scene.playerMoved(dir);
  }
}
