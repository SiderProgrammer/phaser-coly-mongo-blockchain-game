import ServerManager from "./serverManagerBasic";

export default class GuiServerManager extends ServerManager {
  constructor() {
    super();
  }
  onUpdate(cb, context) {
    if (this.eventExists("update")) return;
    this.events.on("update", cb, context);
  }
}
