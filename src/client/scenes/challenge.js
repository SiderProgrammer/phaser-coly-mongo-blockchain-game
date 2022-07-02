import Wizard from "../entities/Wizard";

class Challenge extends Phaser.Scene {
  constructor() {
    super("challenge");
  }

  preload() {
    this.load.image("logo", "./src/client/assets/logo.png");
  }

  create({ server }) {
    this.server = server;

    this.add.image(400, 200, "logo").setScale(0.1);
    this.me = null;

    this.server.onPlayerJoinedChallenge(this.handlePlayerAdd, this);
    this.server.onPlayerMovedInChallenge(this.handlePlayerMove, this);
    this.cursors = this.input.keyboard.createCursorKeys();
  }

  update() {
    if (!this.cursors) return;

    const dir = {
      // vector to determine move direction
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
        const action = {
          type: "move",
          ts: Date.now(),
          playerId: this.playerId,
          dir,
        };

        this.server.handleActionSendInChallenge(action);
      }
    }
  }

  handlePlayerAdd() {
    this.me = new Wizard("0", this, 400, 600, "logo").setScale(0.2);
  }

  handlePlayerMove(player) {
    this.me.setPosition(player.x, player.y);
  }
}

export default Challenge;
