import { HUD_WIDTH } from "../../shared/config";

export default class Hud extends Phaser.Scene {
  constructor() {
    super("hud");
  }

  create({ server, onPlayChallenge }) {
    this.server = server;
    this.onPlayChallenge = onPlayChallenge;

    this.HUDwidth = HUD_WIDTH;

    this.buttons = [];

    this.add
      .image(0, 0, "green")
      .setDisplaySize(this.HUDwidth, this.game.renderer.height * 2); // ? HUD background

    this.server.onPlayerJoinedUI(this.handlePlayerJoinedUI, this);
    this.server.onPlayerUpdateUI(this.updateWizardsStates, this);
  }

  handlePlayerJoinedUI(player) {
    this.add.text(this.HUDwidth / 4, 30, "Your wizards").setOrigin(0.5);
    this.setWizards(player);
  }

  updateWizardsStates(player) {
    player.wizards.forEach((wizard, i) => {
      if (!wizard.isAlive) {
        this.buttons[i].setState("dead");
      }
    });
  }

  addWizardButton(wizard, i) {
    const wizardButton = this.add.image(50, 90 + i * 70, "wizard");
    wizardButton.id = wizard.id;

    this.buttons[i] = wizardButton;

    wizardButton.setState = (state) => {
      switch (state) {
        case "playing":
          const wizard = this.buttons.find(
            (button) => button.currentState === "playing"
          );

          wizard && wizard.setState("alive");
          wizardButton.currentState = "playing";
          wizardButton.stateText.setText("Playing...");
          break;
        case "alive":
          wizardButton.currentState = "alive";
          wizardButton.stateText.setText("Play");
          break;
        case "dead":
          wizardButton.currentState = "dead";
          wizardButton.stateText.setText("Dead");
          break;
      }
    };
  }

  addWizardButtonStateText(worldScene, wizardButton, i, playerId) {
    wizardButton.stateText = this.add
      .text(wizardButton.x + 180, wizardButton.y, "Play")
      .setOrigin(1, 0.5);

    wizardButton.stateText.setInteractive().on("pointerup", () => {
      // TODO : return if clicked wizard is selected || player is during challenge
      //this.player.getSelectedWizardId()
      if (wizardButton.currentState === "dead") return;

      const action = {
        type: "select",
        playerId: playerId,
        wizardId: wizardButton.id,
      };

      this.server.handleActionSend(action);

      wizardButton.setState("playing");
      worldScene.me.setSelectedWizardId(wizardButton.id);
    });
  }

  setWizards(player) {
    const playerId = player.id;
    const wizards = player.wizards;
    const worldScene = this.scene.get("world"); //  TODO : some middleware

    wizards.forEach((wizard, i) => {
      this.addWizardButton(wizard, i);
      this.addWizardButtonStateText(worldScene, this.buttons[i], i, playerId);

      if (!wizard.isAlive) {
        this.buttons[i].setState("dead");
      }
    });

    const id = worldScene.me.getSelectedWizardId();
    this.buttons[id].setState("playing");
  }
}
