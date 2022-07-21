import ServerManager from "./serverManagerBasic";

export default class WorldServerManager extends ServerManager {
  constructor() {
    super();

    this.worldRoom = null;
  }
  setRoom(worldRoom) {
    this.worldRoom = worldRoom;
  }
  onPlayerJoined(cb, context) {
    if (this.eventExists("player-joined")) return;
    this.events.on("player-joined", cb, context);
  }

  onWizardChanged(cb, context) {
    if (this.eventExists("wizard-changed")) return;
    this.events.on("wizard-changed", cb, context);
  }
  onObjectRemoved(cb, context) {
    if (this.eventExists("object-removed")) return;
    this.events.on("object-removed", cb, context);
  }

  handleActionSend(action) {
    if (!this.worldRoom) {
      return;
    }

    this.worldRoom.send(action.type, action);
  }
}
