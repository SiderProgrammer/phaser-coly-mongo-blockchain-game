import { HUD_WIDTH } from "../../../shared/config";
import { HUD_SCENE, WORLD_SCENE } from "../../scenes/currentScenes";
import { CHANGE_NAME } from "../../services/requests/requests";
import Button from "../Button";
import Timer from "./timer";

export default class WizardManager {
  constructor(scene, { id, playerId }) {
    this.scene = scene;
    this.id = id; // ? wizard id
    this.playerId = playerId;

    this.currentState = "";
    this.currentChallengeState = "";

    this.avatar = this.addAvatar();
    this.settings = this.addSettings();
    this.challengeState = this.addChallengeState();
    this.state = this.addState();

    this.setChallengeState("uncompleted");
  }

  getElements() {
    return [
      this.avatar,
      this.settings,
      this.challengeState.completed,
      this.challengeState.notCompletedTimer.time,
      this.state,
    ];
  }

  setState(state) {
    if (this.currentState === "dead") return;

    switch (state) {
      case "playing":
        const manager = this.scene.wizardsManagers.find(
          (manager) => manager.currentState === "playing"
        );
        manager && manager.setState("alive");

        this.currentState = "playing";
        this.state.setText("Playing...");
        break;
      case "alive":
        this.currentState = "alive";
        this.state.setText("Play");
        break;
      case "dead":
        this.currentState = "dead";
        this.state.setText("Dead");
        this.state.setAlpha(0.5);
        this.avatar.setAlpha(0.5);
        break;
    }
  }

  setChallengeState(state) {
    switch (state) {
      case "completed":
        this.currentChallengeState = "completed";
        this.challengeState.notCompletedTimer.setVisible(false);
        this.challengeState.completed.setVisible(true);

        break;
      case "uncompleted":
        this.currentChallengeState = "uncompleted";
        this.challengeState.completed.setVisible(false);
        this.challengeState.notCompletedTimer.setVisible(true);

        break;

      case "dead":
        this.currentChallengeState = "dead";
        this.challengeState.completed.setVisible(false);
        this.challengeState.notCompletedTimer.setVisible(false);
        break;
    }
  }

  addChallengeCompleted() {
    return this.scene.add.image(
      this.avatar.x + 100,
      this.avatar.y,
      "checkmark"
    );
  }

  onDayRefresh() {
    if (this.currentChallengeState === "completed")
      this.setChallengeState("uncompleted");
  }

  addRemainingChallengeTime() {
    const timer = new Timer(
      this.scene,
      this.avatar.x + 60,
      this.avatar.y,
      this.scene.gameState,
      () => this.onDayRefresh()
    );

    timer.start();

    return timer;
  }

  addChallengeState() {
    const challengeState = {
      // should be added to left bar container separated?
      completed: this.addChallengeCompleted(),
      notCompletedTimer: this.addRemainingChallengeTime(),
    };
    return challengeState;
  }

  isInChallenge() {
    return this.scene.server.activeRoom === "challenge";
  }

  addState() {
    const stateText = this.scene.add
      .text(this.avatar.x + 180, this.avatar.y, "Play")
      .setOrigin(1, 0.5);

    stateText.setInteractive().on("pointerup", () => {
      if (this.scene.server.isRegistrationPhase) return;
      if (this.isInChallenge()) return;
      if (this.currentState === "dead") return;

      const action = {
        type: "select",
        playerId: this.playerId,
        wizardId: this.id,
      };

      this.scene.server.handleActionSend(action);

      this.setState("playing");

      this.handlePlayChallengeButton();

      WORLD_SCENE.SCENE.me.setSelectedWizardId(this.id); // TODO : remove it, handle it with state change from back-end
      HUD_SCENE.SCENE.updateCollectedObjectsText(this.id); // TODO : remove it, handle it with state change from back-end
      HUD_SCENE.SCENE.updateMovesLeftText(this.id); // TODO : remove it, handle it with state change from back-end
    });

    return stateText;
  }

  handlePlayChallengeButton() {
    if (
      this.currentChallengeState === "dead" ||
      this.currentChallengeState === "completed"
    ) {
      WORLD_SCENE.SCENE.showPlayChallengeButton(false);
    } else {
      WORLD_SCENE.SCENE.showPlayChallengeButton(true);
    }
  }

  openSettings() {
    const wizardId = this.id;
    // TODO : refactor code, move settings to a new file
    let settings = [];
    const bg = this.scene.add
      .image(HUD_WIDTH / 2, 250, "red")
      .setDisplaySize(HUD_WIDTH - 30, HUD_WIDTH - 30);
    const inputbox = this.scene.add.rexNinePatch({
      x: HUD_WIDTH / 2,
      y: 250,
      width: HUD_WIDTH - 70,
      height: 40,
      key: "inputBox",
      columns: [15, undefined, 15],
      rows: [10, undefined, 10],
    });

    let newName = "";
    const inputText = this.scene.add
      .rexInputText({
        x: HUD_WIDTH / 2,
        y: 260,
        width: HUD_WIDTH - 70,
        height: 40,
        type: "textarea",
        placeholder: "New name",
        fontSize: "20px",
        fontFamily: "SwisBlack",
        color: "#ffffff",
        align: "center",
        maxLength: 10,
      })
      .resize(HUD_WIDTH - 70, 40)
      .on("textchange", ({ text }) => {
        newName = text;
      });

    const confirmButton = new Button(this.scene, HUD_WIDTH / 2, 330, "white")
      .setDisplaySize(100, 30)
      .onClick(() => {
        CHANGE_NAME({
          name: newName,
          address: this.scene.player.address,
          wizardId: wizardId,
        }).then((res) => {
          if (res.ok) {
            WORLD_SCENE.SCENE.me.wizards[wizardId].setName(newName);
            const action = {
              type: "nameChanged",
              wizardId: wizardId,
            };

            this.scene.server.handleActionSend(action);
          }

          settings.forEach((el) => el.destroy());
        });
      })
      .addText("Confirm", { font: "20px Arial", color: "	#000000" });

    settings = [bg, inputbox, inputText, confirmButton];
  }

  addSettings() {
    return new Button(
      this.scene,
      this.avatar.x + this.avatar.displayWidth / 2,
      this.avatar.y,
      "gear"
    )
      .setOrigin(0.5, 0.5)
      .onClick(() => {
        if (this.scene.server.isRegistrationPhase) return;
        if (this.isInChallenge()) return;
        this.openSettings();
      });
  }

  addAvatar() {
    return this.scene.add.image(50, 90 + this.id * 70, "wizard");
  }
}
