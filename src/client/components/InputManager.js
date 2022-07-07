export default class InputManager {
  constructor(scene) {
    this.scene = scene;
    this.cursors = scene.input.keyboard.createCursorKeys();
  }

  update() {
    if (!this.cursors) return;

    const dir = {
      x: 0,
      y: 0,
    };

    if (
      this.cursors.up.isDown ||
      this.cursors.down.isDown ||
      this.cursors.left.isDown ||
      this.cursors.right.isDown
    ) {
      if (this.cursors.up.isDown) {
        dir.y -= 1;
      }

      if (this.cursors.down.isDown) {
        dir.y += 1;
      }

      if (this.cursors.left.isDown) {
        dir.x -= 1;
      }

      if (this.cursors.right.isDown) {
        dir.x += 1;
      }

      if (dir.x != 0 || dir.y != 0) {
        this.scene.playerMoved(dir);
      }
    }
  }
}
