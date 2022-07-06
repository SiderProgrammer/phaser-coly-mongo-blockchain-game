import Wizard from "../entities/Wizard";

class Challenge extends Phaser.Scene {
  constructor() {
    super("challenge");
  }

  preload() {}

  create({ server, onLoseChallenge, onWinChallenge }) {
    this.server = server;
    this.onLoseChallenge = onLoseChallenge;
    this.onWinChallenge = onWinChallenge;

    this.add.image(400, 300, "logo").setDisplaySize(50, 50);
    this.add.image(400, 50, "logo").setDisplaySize(50, 50);
    this.me = null;

    this.server.onPlayerJoinedChallenge(this.handlePlayerAdd, this);
    this.server.onPlayerMovedInChallenge(this.handlePlayerMove, this);
    this.server.onChallengeStateChanged(this.handleChangeState, this);
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

  handleChangeState(changedData) {
    const updatedState = changedData.find(
      (data) => data.field === "challengeState"
    );

    if (updatedState) {
      if (updatedState.value === 0) {
        this.onLoseChallenge();
      } else if (updatedState.value === 1) {
        this.onWinChallenge();
      }
    }
  }

  handlePlayerAdd() {
    console.log("Player added");
    this.me = new Wizard("0", this, 400, 600, "logo").setScale(0.2);
  }

  handlePlayerMove(changedData) {
    const updatedPosition = changedData.filter(
      (data) => data.field === "x" || data.field === "y"
    );
    const updatedX = updatedPosition.find((pos) => pos.field === "x")
      ? updatedPosition.find((pos) => pos.field === "x").value
      : this.me.x;
    const updatedY = updatedPosition.find((pos) => pos.field === "y")
      ? updatedPosition.find((pos) => pos.field === "y").value
      : this.me.y;

    this.me.setPosition(updatedX, updatedY);
  }
}

export default Challenge;
