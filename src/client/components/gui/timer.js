export default class Timer {
  constructor(scene, x, y, gameState, onDayRefresh) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.gameState = gameState;
    this.onDayRefresh = onDayRefresh;

    this.remainingTime = this.calculateRemainingTime();
    this.time = this.addTime();
  }

  setVisible(bool) {
    this.time.setVisible(bool);
  }

  start() {
    this.countdown = this.scene.time.addEvent({
      repeat: -1,
      delay: 1000 * 1,
      callback: () => this.update(),
    });
  }

  addTime() {
    return this.scene.add.text(this.x, this.y, "").setOrigin(0.5);
  }

  calculateRemainingTime() {
    // TODO : handle it to not repeat the code in game room
    return (
      this.gameState.gameStartTimestamp +
      this.gameState.day * this.gameState.dayDuration -
      Date.now() -
      (Date.now() - this.gameState.timeDifference)
    );
  }

  getConvertedTime() {
    const newDateTime = new Date(this.remainingTime);
    return newDateTime.getHours() - 1 + "h" + newDateTime.getMinutes() + "m";
  }

  update() {
    this.remainingTime -= 1000 * 1;

    if (this.remainingTime < 0) {
      this.remainingTime = this.gameState.dayDuration;
      this.onDayRefresh();
    }

    this.time.setText(this.getConvertedTime());
  }
}
