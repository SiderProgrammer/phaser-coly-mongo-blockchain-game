import { PLAYER_SIZE, PRE_MOVE_DISTANCE } from "../../shared/config";
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
        _wizard.x,
        _wizard.y,
        "player",
        _wizard.name
      );

      wizard.setDisplaySize(PLAYER_SIZE, PLAYER_SIZE);

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

    if (_wizard.x != wizardToUpdate.x || _wizard.y != wizardToUpdate.y) {
      wizardToUpdate.walkTo(_wizard.x, _wizard.y);

      this.scene.mapGridManager.setTileEmpty(
        wizardToUpdate.x,
        wizardToUpdate.y
      );

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
