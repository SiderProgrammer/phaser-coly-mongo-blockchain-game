import { HUD_HEIGHT } from "../../shared/config";
import SoundManager from "../components/SoundManager";
import { GET_GAME_STATE } from "../services/requests/requests";
import { HUD_SCENE, WORLD_SCENE } from "./currentScenes";

export default class Hud extends Phaser.Scene {
  constructor() {
    super("hud");
  }

  create({ server, gameState }) {
    HUD_SCENE.setScene(this);
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
    this.addMovesLeft();
    this.addCollectedObjects();
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

  updateSlogan(newSlogan) {
    this.slogan.setText(newSlogan);
  }

  updateDay(newDay) {
    this.day.setText(`DAY ${newDay}`);
  }

  updateCollectedObjects(obj) {
    const wizard = WORLD_SCENE.SCENE.me.getWizardById(obj.wizardId);
    if (wizard.collectedObjects[obj.type] !== -1) {
      // type = 1 / 2 / 3
      SoundManager.play("ObjectCollect");
    }
    wizard.collectedObjects[obj.type] = obj.value; // TODO : move it to world scene

    const currentWizardID = WORLD_SCENE.SCENE.me.getSelectedWizardId();
    this.updateCollectedObjectsText(currentWizardID);
  }

  updateMovesLeft(_wizard) {
    const wizard = WORLD_SCENE.SCENE.me.getWizardById(_wizard.id);

    wizard.movesLeft = _wizard.movesLeft; // TODO : move it to world scene

    const currentWizardID = WORLD_SCENE.SCENE.me.getSelectedWizardId();
    this.updateMovesLeftText(currentWizardID);
  }

  updateMovesLeftText(wizardId) {
    let movesLeft = 0;

    if (wizardId > -1) {
      movesLeft = WORLD_SCENE.SCENE.me.getWizardById(
        wizardId.toString()
      ).movesLeft;
    }

    this.movesLeft.setText(`Moves left: ${movesLeft}`);
  }

  updateCollectedObjectsText(wizardId) {
    let collectedObjects = {
      1: 0,
      2: 0,
      3: 0,
    };

    if (wizardId > -1) {
      collectedObjects = WORLD_SCENE.SCENE.me.getWizardById(
        wizardId.toString()
      ).collectedObjects;
    }
    this.collectedObjects.setText(
      `Collected objects: ${collectedObjects["1"]}`
    );

    this.collectedObjects2.setText(
      `Collected objects 2: ${collectedObjects["2"]}`
    );

    this.collectedObjects3.setText(
      `Collected objects 3: ${collectedObjects["3"]}`
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
  addMovesLeft() {
    this.movesLeft = this.add
      .text(this.width / 2 + 150, this.height / 2, "Moves left:", {
        font: "25px Arial",
      })
      .setOrigin(0.5);
  }
  addCollectedObjects() {
    this.collectedObjects2 = this.add
      .text(this.width - 10, 10, "Collected objects 2: 0", {
        font: "15px Arial",
      })
      .setOrigin(1, 0);

    this.collectedObjects = this.add
      .text(this.width - 10, 30, "Collected objects: 0", {
        font: "15px Arial",
      })
      .setOrigin(1, 0);

    this.collectedObjects3 = this.add
      .text(this.width - 10, 50, "Collected objects 3: 0", {
        font: "15px Arial",
      })
      .setOrigin(1, 0);
  }
}
