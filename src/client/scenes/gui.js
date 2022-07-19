import { HUD_WIDTH } from "../../shared/config";

export default class Gui extends Phaser.Scene {
  constructor() {
    super("gui");
  }

  create({ server, gameState, player }) {
    this.server = server;
    this.gameState = gameState;
    this.player = player;

    this.GUIwidth = HUD_WIDTH;

    this.buttons = [];

    this.leftBar = this.add
      .image(0, 0, "green")
      .setDisplaySize(this.GUIwidth, this.game.renderer.height * 2)
      .setOrigin(0);
    this.leftBarContainer = this.add.container(0, 70);
    this.addPlayer(this.player);
    this.server.onUpdateGUI(this.handleUpdate, this);
  }

  handleUpdate(player) {
    // TODO : handle case all wizards dead
    player.wizards.forEach((wizard, i) => {
      if (!wizard.isAlive && this.buttons[i].currentState !== "dead") {
        this.buttons[i].setState("dead");
        this.buttons[i].setChallengeState("dead");
      }

      if (wizard.dailyChallengeCompleted) {
        this.buttons[i].setChallengeState("completed");
      }
    });

    const worldScene = this.scene.get("world");
    const id = worldScene.me.getSelectedWizardId();
    this.buttons[id].setState("playing");
  }

  addPlayer(player) {
    const yourWizards = this.add
      .text(this.GUIwidth / 2, 30, "Your wizards")
      .setOrigin(0.5);
    this.leftBarContainer.add(yourWizards);

    this.addWizards(player);
  }

  addWizardButton(i) {
    const wizardButton = this.add.image(50, 90 + i * 70, "wizard");
    wizardButton.id = i;

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
          wizardButton.stateText.setAlpha(0.5);
          wizardButton.setAlpha(0.5);
          break;
      }
    };

    return wizardButton;
  }

  addWizardButtonStateText(worldScene, wizardButton, playerId) {
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

    return wizardButton.stateText;
  }

  addWizardButtonChallengeState(wizard, wizardButton) {
    wizardButton.setChallengeState = (state) => {
      switch (state) {
        case "completed":
          wizardButton.currentChallengeState = "completed";

          wizardButton.challengeStateInfo &&
            wizardButton.challengeStateInfo.destroy();

          wizardButton.challengeStateInfo =
            wizardButton.addChallengeCompleted();

          this.leftBarContainer.add(wizardButton.challengeStateInfo);
          break;
        case "uncompleted":
          wizardButton.currentChallengeState = "uncompleted";

          wizardButton.challengeStateInfo &&
            wizardButton.challengeStateInfo.destroy();

          wizardButton.challengeStateInfo =
            wizardButton.addRemainingChallengeTime();
          this.leftBarContainer.add(wizardButton.challengeStateInfo);
          break;

        case "dead":
          wizardButton.currentChallengeState = "dead";

          wizardButton.challengeStateInfo &&
            wizardButton.challengeStateInfo.destroy();
          break;
      }
    };

    wizardButton.addChallengeCompleted = () => {
      return this.add.image(wizardButton.x + 100, wizardButton.y, "checkmark");
    };

    let remainingTime =
      Date.now() -
      this.gameState.gameStartTimestamp -
      (this.gameState.day - 1) * this.gameState.dayDuration;
    // Date.now() -
    // this.gameState.gameStartTimestamp +
    // this.gameState.dayDuration * this.gameState.day;

    wizardButton.addRemainingChallengeTime = () => {
      const time = this.add
        .text(wizardButton.x + 60, wizardButton.y, "")
        .setOrigin(0.5);

      time.getConvertedTime = () => {
        const newDateTime = new Date(remainingTime);

        return (
          newDateTime.getHours() - 1 + "h" + newDateTime.getMinutes() + "m"
        );
      };

      time.update = () => {
        remainingTime -= 1000 * 60;

        if (remainingTime < 0) {
          remainingTime = this.gameState.dayDuration;
          this.server.updateSlogan();
        }

        time.active && time.setText(time.getConvertedTime());
      };

      this.time.addEvent({
        repeat: -1,
        delay: 1000 * 60,
        callback: () => time.update(),
      });

      time.update();

      return time;
    };

    wizardButton.setChallengeState("uncompleted");

    // if (wizard.dailyChallengeCompleted) {
    //   wizardButton.challengeState = this.add.image(wizardButton.x + 100, wizardButton.y, "checkmark")
    //   return wizardButton.challengeState;
    // }

    // if (wizard.isDead) {
    //   return this.add
    //     .image(wizardButton.x + 100, wizardButton.y, "checkmark")
    //     .setVisible(false);
    // }

    // if (remainingTime > this.gameState.dayDuration) {
    //   // TODO : handle day time end
    // }

    // wizardButton.challengeState = time

    return wizardButton.challengeStateInfo;
  }

  addWizards(player) {
    const playerId = player.id;
    const wizards = player.wizards;
    const worldScene = this.scene.get("world");

    wizards.forEach((wizard, i) => {
      const wizardButton = this.addWizardButton(i);

      const challengeState = this.addWizardButtonChallengeState(
        wizard,
        wizardButton
      );
      const stateText = this.addWizardButtonStateText(
        worldScene,
        wizardButton,
        playerId
      );

      this.leftBarContainer.add([wizardButton, challengeState, stateText]);

      if (!wizard.isAlive) {
        wizardButton.setState("dead");
      }

      if (wizard.dailyChallengeCompleted) {
        wizardButton.setChallengeState("completed");
      }
    });
  }
}
