import { HUD_WIDTH } from "../../shared/config";
import Button from "../components/Button";
import WizardManager from "../components/gui/wizardManager";
import { CHANGE_NAME } from "../services/requests/requests";
import { GUI_SCENE, HUD_SCENE, WORLD_SCENE } from "./currentScenes";

export default class Gui extends Phaser.Scene {
  constructor() {
    super("gui");
  }

  create({ server, gameState, player }) {
    GUI_SCENE.setScene(this);
    this.server = server;
    this.gameState = gameState;
    this.player = player;

    this.GUIwidth = HUD_WIDTH;

    this.wizardsManagers = [];

    this.leftBar = this.add
      .image(0, 0, "green")
      .setDisplaySize(this.GUIwidth, this.game.renderer.height * 2)
      .setOrigin(0);
    this.leftBarContainer = this.add.container(0, 70);
    this.addPlayer(this.player);
  }

  handleUpdate(wizard) {
    const i = Number(wizard.id);
    const wizardManager = this.wizardsManagers[i];

    if (!wizard.isAlive && wizardManager.currentState !== "dead") {
      wizardManager.setState("dead");
      wizardManager.setChallengeState("dead");
    }

    if (wizard.dailyChallengeCompleted) {
      wizardManager.setChallengeState("completed");
    } else if (wizard.isAlive) {
      wizardManager.setChallengeState("uncompleted");
    } else if (!wizard.isAlive) {
      wizardManager.setChallengeState("dead");
    }

    if (wizard.isAlive) {
      wizardManager.setState("alive");
    }

    const id = WORLD_SCENE.SCENE.me.getSelectedWizardId();
    if (id > -1) {
      this.wizardsManagers[id].setState("playing");
      this.wizardsManagers[id].handlePlayChallengeButton();
    }
  }

  addPlayer(player) {
    const yourWizards = this.add
      .text(this.GUIwidth / 2, 30, "Your wizards")
      .setOrigin(0.5);
    this.leftBarContainer.add(yourWizards);

    this.addWizardsManagers(player);
  }

  addWizardsManagers(player) {
    player.wizards.forEach((wizard, i) => {
      const wizardManager = new WizardManager(this, {
        id: i,
        playerId: player.id,
      });

      this.wizardsManagers.push(wizardManager);

      this.leftBarContainer.add(wizardManager.getElements());

      if (!wizard.isAlive) {
        wizardManager.setState("dead");
      }

      if (wizard.dailyChallengeCompleted) {
        wizardManager.setChallengeState("completed");
      }
    });
  }
}
