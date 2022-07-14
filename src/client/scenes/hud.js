import { HUD_HEIGHT } from "../../shared/config";

export default class Hud extends Phaser.Scene {
  constructor() {
    super("hud");
  }

  create({ server, gameState }) {
    this.server = server;
    this.gameState = gameState;
    this.width = this.game.renderer.width;
    this.height = HUD_HEIGHT;
    this.wizardsAliveCount = 0;
    this.wizardsCount = 0;

    this.topBar = this.add
      .image(0, 0, "red")
      .setOrigin(0)
      .setDisplaySize(this.width, this.height);

    this.addDays();
    this.addSlogan();
    this.addWizardsLeft();
    this.server.onUpdateHUD(this.handleUpdate, this);
  }

  handleUpdate(count, type) {
    if (type === "alive") {
      this.wizardsAliveCount = count;
    } else {
      this.wizardsCount = count;
    }

    this.wizardsLeft.setText(
      `Wizards left: ${this.wizardsAliveCount}/${this.wizardsCount}`
    );
  }

  addWizardsLeft() {
    this.wizardsLeft = this.add
      .text(10, 10, "", {
        font: "35px Arial",
      })
      .setOrigin(0, 0);
  }
  addDays() {
    this.add
      .text(this.width / 2, 10, `DAY ${this.gameState.day}`, {
        font: "35px Arial",
      })
      .setOrigin(0.5, 0);
  }

  addSlogan() {
    this.add
      .text(this.width / 2, this.height - 10, this.gameState.slogan, {
        font: "15px Arial",
      })
      .setOrigin(0.5, 1);
  }
  addCollectedObjects() {}
}
