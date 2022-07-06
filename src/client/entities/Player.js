import Wizard from "./Wizard";

class Player {
  constructor(scene, sessionId, walletAddress, isMe) {
    this.scene = scene;
    this.sessionId = sessionId;
    this.walletAddress = walletAddress;
    this.isMe = isMe;
    this.wizards = [];
    this.state = "alive";

    this.selectedWizardId = 0;
  }

  addWizards(wizards) {
    wizards.forEach((_wizard, id) => {
      const wizard = new Wizard(
        id.toString(),
        this.scene,
        _wizard.x,
        _wizard.y,
        "logo",
        _wizard.name
      );
      wizard.setScale(0.2);

      if (!_wizard.isAlive) wizard.kill();

      this.wizards.push(wizard);
    });
  }

  updateWizard(_wizard) {
    const wizardToUpdate = this.wizards.find(
      (wizard) => wizard.id === _wizard.id
    );
    wizardToUpdate.update(_wizard.x, _wizard.y);
  }

  getSelectedWizardId() {
    return this.selectedWizardId;
  }
  setSelectedWizardId(id) {
    this.selectedWizardId = id;
  }
}

export default Player;
