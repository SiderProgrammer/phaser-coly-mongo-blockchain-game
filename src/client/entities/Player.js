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

  preMove(dir) {
    const wizard = this.getSelectedWizard();
    if (!wizard.isAlive) return;

    wizard.preMove(dir, PRE_MOVE_DISTANCE);
    wizard.playWalkAnimation(dir);
  }

  reversePreMove() {
    const wizard = this.getSelectedWizard();
    wizard.reversePreMove();
  }

  updateWizard(_wizard) {
    const wizardToUpdate = this.wizards.find(
      (wizard) => wizard.id === _wizard.id
    );
    if (!_wizard.isAlive && wizardToUpdate.isAlive) {
      wizardToUpdate.kill();
      return;
    }
    wizardToUpdate.isReversePreMove = _wizard.reversePreMove;
    if (wizardToUpdate.isReversePreMove) {
      wizardToUpdate.canMove = true;
      this.reversePreMove();
      return;
    }
    if (_wizard.x != wizardToUpdate.x || _wizard.y != wizardToUpdate.y) {
      // wizardToUpdate.moveTween =
      wizardToUpdate.walkTo(_wizard.x, _wizard.y);
    }
    // wizardToUpdate.update(_wizard.x, _wizard.y);
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
