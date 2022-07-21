import ServerManager from "./serverManagerBasic";

export default class HudServerManager extends ServerManager {
  constructor() {
    super();
  }
  onUpdate(cb, context) {
    if (this.eventExists("update")) return;

    this.events.on("update", cb, context);
  }
  onUpdateObjects(cb, context) {
    if (this.eventExists("update-objects")) return;

    this.events.on("update-objects", cb, context);
  }

  onUpdateSlogan(cb, context) {
    if (this.eventExists("update-slogan")) return;

    this.events.on("update-slogan", cb, context);
  }
}
