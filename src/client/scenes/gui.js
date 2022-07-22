import { HUD_WIDTH } from "../../shared/config";
import Button from "../components/Button";
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

    this.buttons = [];

    this.leftBar = this.add
      .image(0, 0, "green")
      .setDisplaySize(this.GUIwidth, this.game.renderer.height * 2)
      .setOrigin(0);
    this.leftBarContainer = this.add.container(0, 70);
    this.addPlayer(this.player);
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

    const id = WORLD_SCENE.SCENE.me.getSelectedWizardId();
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
      if (wizardButton.currentState === "dead") return;

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

  addWizardButtonStateText(wizardButton, playerId) {
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

      WORLD_SCENE.SCENE.me.setSelectedWizardId(wizardButton.id); // TODO : remove it, handle it with state change from back-end
      HUD_SCENE.SCENE.setWizardObjectsCounter(wizardButton.id); // TODO : remove it, handle it with state change from back-end
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

    let remainingTime = // TODO : handle it to not repeat the code in game room
      this.gameState.gameStartTimestamp +
      this.gameState.day * this.gameState.dayDuration -
      Date.now();

    wizardButton.addRemainingChallengeTime = () => {
      const time = this.add
        .text(wizardButton.x + 60, wizardButton.y, "")
        .setOrigin(0.5);

      time.getConvertedTime = () => {
        const newDateTime = new Date(remainingTime); // TODO: make it more synchronized

        return (
          newDateTime.getHours() - 1 + "h" + newDateTime.getMinutes() + "m"
        );
      };

      time.update = () => {
        remainingTime -= 1000 * 1; // TODO : fix time is not synchronized with server

        if (remainingTime < 0) {
          remainingTime = this.gameState.dayDuration;

          this.buttons.forEach((button) => {
            if (button.currentChallengeState === "completed")
              button.setChallengeState("uncompleted");
          });

          wizardButton.timer.remove(); // TODO : fix timer, not working correctly after day refresh
          this.server.updateSlogan();
        }

        time.active && time.setText(time.getConvertedTime());
      };

      wizardButton.timer = this.time.addEvent({
        repeat: -1,
        delay: 1000 * 1, // TODO: handle it better instead of checking every second
        callback: () => time.update(),
      });

      time.setText(time.getConvertedTime());

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

  openSettings() {
    // TODO : refactor code, move settings to a new scene
    let settings = [];
    const bg = this.add
      .image(this.leftBar.displayWidth / 2, 250, "red")
      .setDisplaySize(this.GUIwidth - 30, this.GUIwidth - 30);
    const inputbox = this.add.rexNinePatch({
      x: this.leftBar.displayWidth / 2,
      y: 250,
      width: this.GUIwidth - 70,
      height: 40,
      key: "inputBox",
      columns: [15, undefined, 15],
      rows: [10, undefined, 10],
    });

    let newName = "";
    const inputText = this.add
      .rexInputText({
        x: this.leftBar.displayWidth / 2,
        y: 260,
        width: this.GUIwidth - 70,
        height: 40,
        type: "textarea",
        placeholder: "New name",
        fontSize: "20px",
        fontFamily: "SwisBlack",
        color: "#ffffff",
        align: "center",
        maxLength: 10,
      })
      .resize(this.GUIwidth - 70, 40)
      .on("textchange", ({ text }) => {
        newName = text;
      });

    const confirmButton = new Button(
      this,
      this.leftBar.displayWidth / 2,
      330,
      "white"
    )
      .setDisplaySize(100, 30)
      .onClick(() => {
        // TODO: handle nickname changes errors etc.
        const me = WORLD_SCENE.SCENE.me;

        CHANGE_NAME({
          name: newName,
          address: this.player.address,
          wizardId: me.getSelectedWizardId(),
        });

        settings.forEach((el) => el.destroy());
        console.log(newName);

        me.getSelectedWizard().setName(newName);
      })
      .addText("Confirm", { font: "20px Arial", color: "	#000000" });

    settings = [bg, inputbox, inputText, confirmButton];
  }

  addSettings(wizardButton) {
    return new Button(
      this,
      wizardButton.x + wizardButton.displayWidth / 2,
      wizardButton.y,
      "gear"
    )
      .setOrigin(0.5, 0.5)
      .onClick(() => {
        this.openSettings(wizardButton.id);
      });
  }

  addWizards(player) {
    const playerId = player.id;
    const wizards = player.wizards;

    wizards.forEach((wizard, i) => {
      const wizardButton = this.addWizardButton(i);

      const challengeState = this.addWizardButtonChallengeState(
        wizard,
        wizardButton
      );
      const stateText = this.addWizardButtonStateText(wizardButton, playerId);

      const settings = this.addSettings(wizardButton);

      this.leftBarContainer.add([
        wizardButton,
        settings,
        challengeState,
        stateText,
      ]);

      if (!wizard.isAlive) {
        wizardButton.setState("dead");
      }

      if (wizard.dailyChallengeCompleted) {
        wizardButton.setChallengeState("completed");
      }
    });
  }
}
