import { PLAYER_SIZE, PRE_MOVE_DISTANCE } from "../../shared/config";
import Wizard from "./Wizard";

class Player {
  constructor(scene, sessionId, walletAddress, isMe = false) {
    this.scene = scene;
    this.sessionId = sessionId;
    this.walletAddress = walletAddress;
    this.isMe = isMe;
    this.wizards = [];
    this.state = "alive";
    this.isOnline = sessionId !== "";

    this.selectedWizardId = -1;
  }

  destroy() {
    this.wizards.forEach((wizard) => {
      wizard.destroy();
      wizard.name.destroy();
    });
  }

  addWizards(wizards) {

    wizards.forEach((_wizard, id) => {
      const wizard = new Wizard(
        id.toString(),
        this.scene,
        _wizard.r,
        _wizard.c,
        "player",
        _wizard.name,
        this.isMe
      );

      wizard.setDisplaySize(PLAYER_SIZE, PLAYER_SIZE); // remove it later

      if (!_wizard.isAlive) wizard.kill();

      this.wizards.push(wizard);
    });
  }

  updateWizard(_wizard) {
    // TODO : it needs improvements
    const wizardToUpdate = this.wizards.find(
      (wizard) => wizard.id === _wizard.id
    );
    if (!_wizard.isAlive && wizardToUpdate.isAlive) {
      wizardToUpdate.kill();
      return;
    }

    if (wizardToUpdate.name !== _wizard.name) {
      wizardToUpdate.setName(_wizard.name);
    }

    if (_wizard.c != wizardToUpdate.c || _wizard.r != wizardToUpdate.r) {
      this.scene.mapGridManager.setTileEmpty(
        wizardToUpdate.r,
        wizardToUpdate.c
      );

      this.scene.mapGridManager.addWizardToGrid(_wizard);

      wizardToUpdate.walkTo(_wizard.r, _wizard.c);

      // ? lag simulator
      // setTimeout(
      //   () =>
      //     wizardToUpdate.walkTo(
      //       wizardToUpdate.preMoveDir,
      //       _wizard.x,
      //       _wizard.y
      //     ),
      //   200
      // );
    }
  }

  getWizardById(id) {
    return this.wizards.find((wizard) => wizard.id === id);
  }

  getSelectedWizard() {
    return this.wizards.find(
      (wizard) => wizard.id === this.selectedWizardId.toString()
    );
  }

  getSelectedWizardId() {
    return this.selectedWizardId;
  }
  setSelectedWizardId(id) {
    //if (!this.wizards[id]) return;
    this.scene.cameras.main.startFollow(this.wizards[id]);
    this.selectedWizardId = id;
  }
}

export default Player;
