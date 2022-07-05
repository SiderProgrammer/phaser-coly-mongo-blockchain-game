export default class Hud extends Phaser.Scene {
  constructor() {
    super("hud");
  }

  create({ server, onPlayChallenge }) {
    this.server = server;
    this.onPlayChallenge = onPlayChallenge;

    this.buttons = [];

    this.server.onPlayerJoinedUI(this.handlePlayerJoinedUI, this);
  }

  handlePlayerJoinedUI(player, playerId) {
    this.add.text(30, 30, "Your wizards").setOrigin(0.5);
    this.setWizards(player, playerId);
  }

  setWizards(player, playerId) {
    const wizards = player.wizards;
    const worldScene = this.scene.get("world"); //  TODO - some middleware

    for (let i = 0; i < wizards.length; i++) {
      const wizardButton = this.add
        .image(30, 60 + i * 70, "logo")
        .setScale(0.1);
      wizardButton.id = wizards[i].id;

      this.buttons[i] = wizardButton;

      wizardButton.stateText = this.add
        .text(wizardButton.x + 30, wizardButton.y, "Play")
        .setOrigin(0, 0.5);

      wizardButton.stateText.setInteractive().on("pointerup", () => {
        // TODO - return if clicked wizard is selected || player is during challenge
        //this.player.getSelectedWizardId()

        const action = {
          type: "select",
          ts: Date.now(),
          playerId: playerId,
          wizardId: wizardButton.id,
        };

        this.server.handleActionSend(action);

        wizardButton.setState("playing");
        worldScene.me.setSelectedWizardId(wizardButton.id);
      });

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

      this.buttons[worldScene.me.getSelectedWizardId()].setState("playing");
    }
  }
}
