export default class ServerManager {
  constructor() {
    this.events = new Phaser.Events.EventEmitter();
  }
  eventExists(event) {
    return this.events.eventNames().some((name) => name === event);
  }
}
