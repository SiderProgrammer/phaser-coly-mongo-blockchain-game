import { calculateDayRemainingTime } from "../../../shared/utils";

export default class Timer {
  constructor(scene, x, y, gameState, onDayRefresh) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.gameState = gameState;
    this.onDayRefresh = onDayRefresh;

    this.remainingTime = calculateDayRemainingTime(gameState);
    this.time = this.addTime();
  }

  setVisible(bool) {
    this.time.setVisible(bool);
  }

  start() {
    this.countdown = setInterval(() => this.update(), 1000);
  }

  addTime() {
    return this.scene.add.text(this.x, this.y, "").setOrigin(0.5);
  }

  getConvertedTime() {
    const newDateTime = new Date(this.remainingTime);
    return newDateTime.getHours() - 1 + "h" + newDateTime.getMinutes() + "m";
  }

  update() {
    this.remainingTime = calculateDayRemainingTime(this.gameState);

    if (this.remainingTime < 0) {
      this.gameState.dayCount++;

      this.onDayRefresh();
    }

    this.time.setText(this.getConvertedTime());
  }
}
