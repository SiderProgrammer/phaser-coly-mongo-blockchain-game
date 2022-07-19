import { HUD_HEIGHT } from "../../shared/config";
import { GET_GAME_STATE } from "../services/requests/requests";

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
    this.addCollectedObjects();
    this.wizardsCollectedObjects = {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
    };

    this.worldScene = this.scene.get("world");

    this.server.onUpdateHUD(this.handleUpdate, this);
    this.server.onUpdateSlogan(this.updateSlogan, this);
    this.server.onUpdateHUDobjects(this.updateCollectedObjects, this);
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

  async updateSlogan() {
    // TODO : fix it
    const gameState = await (await GET_GAME_STATE()).json();
    this.slogan.setText(gameState.slogan);
    this.day.setText(`DAY ${gameState.day}`);
  }

  updateCollectedObjects(newValue) {
    this.collectedObjects.setText(`Collected objects: ${newValue}`);
  }

  addWizardsLeft() {
    this.wizardsLeft = this.add
      .text(10, 10, "", {
        font: "35px Arial",
      })
      .setOrigin(0, 0);
  }
  addDays() {
    this.day = this.add
      .text(this.width / 2, 10, `DAY ${this.gameState.day}`, {
        font: "35px Arial",
      })
      .setOrigin(0.5, 0);
  }

  addSlogan() {
    this.slogan = this.add
      .text(this.width / 2, this.height - 10, this.gameState.slogan, {
        font: "15px Arial",
      })
      .setOrigin(0.5, 1);
  }
  addCollectedObjects() {
    this.collectedObjects = this.add
      .text(this.width - 10, 10, "Collected objects: 0", {
        font: "35px Arial",
      })
      .setOrigin(1, 0);
  }
}
