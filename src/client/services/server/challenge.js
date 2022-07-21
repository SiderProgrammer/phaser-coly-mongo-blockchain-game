import ServerManager from "./serverManagerBasic";

export default class ChallengeServerManager extends ServerManager {
  constructor(challengeRoom) {
    super();

    this.challengeRoom = challengeRoom;
  }
  onPlayerMoved(cb, context) {
    if (this.eventExists("player-move")) return;
    this.events.on("player-move", cb, context);
  }

  onChanged(cb, context) {
    if (this.eventExists("state-changed")) return;
    this.events.on("state-changed", cb, context);
  }

  onPlayerJoined(cb, context) {
    if (this.eventExists("player-joined")) return;
    this.events.on("player-joined", cb, context);
  }

  handleActionSend(action) {
    if (!this.challengeRoom) {
      return;
    }

    this.challengeRoom.send(action.type, action);
  }
}
