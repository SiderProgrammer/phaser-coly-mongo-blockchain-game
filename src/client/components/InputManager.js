export default class InputManager {
  constructor(scene) {
    this.scene = scene;

    scene.input.keyboard.addKey("LEFT").on("down", () => this.update("LEFT"));
    scene.input.keyboard.addKey("RIGHT").on("down", () => this.update("RIGHT"));
    scene.input.keyboard.addKey("UP").on("down", () => this.update("UP"));
    scene.input.keyboard.addKey("DOWN").on("down", () => this.update("DOWN"));
  }

  update(key) {
    const dir = {
      x: 0,
      y: 0,
    };

    {
      if (key === "UP") {
        dir.y -= 1;
      }

      if (key === "DOWN") {
        dir.y += 1;
      }

      if (key === "LEFT") {
        dir.x -= 1;
      }

      if (key === "RIGHT") {
        dir.x += 1;
      }

      this.scene.playerMoved(dir);
    }
  }
}
