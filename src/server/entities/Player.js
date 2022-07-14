const schema = require("@colyseus/schema");
const { PLAYER_SIZE, WORLD_SIZE } = require("../../shared/config");
const Schema = schema.Schema;
const ArraySchema = schema.ArraySchema;

const { Wizard } = require("./Wizard");

class Player extends Schema {
  constructor(id, address) {
    super();
    this.id = id; // session id
    this.address = address; // wallet address
    this.wizards = new ArraySchema(); // TODO : change this.wizards to a mapSchema instead of arraySchema
  }

  addWizards(wizardsState) {
    wizardsState.forEach((_wizard, i) => {
      const wizard = new Wizard(
        i.toString(),
        _wizard.x,
        _wizard.y,
        PLAYER_SIZE,
        _wizard.name
      );
      wizard.isAlive = _wizard.isAlive;
      wizard.dailyChallengeCompleted = _wizard.dailyChallengeCompleted;

      this.wizards.push(wizard);

      if (wizard.isAlive) {
        this.wizards[i].isSelected = true;
      }
    });
  }

  move(vectorX, vectorY, speed) {
    const wizard = this.getSelectedWizard();
    //if (!wizard || !wizard.isAlive) return;

    wizard.move(vectorX, vectorY, speed);
  }

  canMove(dirX, dirY, speed) {
    const wizard = this.getSelectedWizard();
    if (!wizard || !wizard.isAlive) return false;

    const speedX = speed * dirX;
    const speedY = speed * dirY;

    if (wizard.x + speedX < 0) return false;
    if (wizard.x + speedX > WORLD_SIZE.WIDTH) return false;

    if (wizard.y + speedY < 0) return false;
    if (wizard.y + speedY > WORLD_SIZE.HEIGHT) return false;

    return true;
  }

  selectWizard(wizardId) {
    this.wizards.forEach((wizard) => (wizard.isSelected = false));
    this.wizards[wizardId].isSelected = true;
  }

  getSelectedWizard() {
    return this.wizards.find((wizard) => wizard.isSelected);
  }
}

schema.defineTypes(Player, {
  id: "string",
  address: "string",
  wizards: [Wizard],
});

exports.Player = Player;
