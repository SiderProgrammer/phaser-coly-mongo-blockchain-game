const schema = require("@colyseus/schema");
const Schema = schema.Schema;
const ArraySchema = schema.ArraySchema;

const { Wizard } = require("./Wizard");

class Player extends Schema {
  constructor(id, address) {
    super();
    this.id = id; // session id
    this.address = address;
    this.wizards = new ArraySchema(); // ! change to mapSchema // effect => this.wizards[id]
  }

  addWizards(wizardsState) {
    wizardsState.forEach((state, i) => {
      const wizard = new Wizard(i.toString(), state.x, state.y, 50, state.name);
      wizard.isAlive = state.isAlive;

      this.wizards.push(wizard);
    });
    this.wizards[0].isSelected = true;
  }

  move(vectorX, vectorY, speed) {
    const wizard = this.wizards.find((wizard) => wizard.isSelected);

    if (!wizard.isAlive) return; // TODO : fix it

    wizard.move(vectorX, vectorY, speed);
  }

  selectWizard(wizardId) {
    this.wizards.forEach((wizard) => (wizard.isSelected = false));
    this.getWizardById(wizardId).isSelected = true;
  }

  getWizardById(id) {
    return this.wizards.find((wizard) => wizard.id === id);
  }
}

schema.defineTypes(Player, {
  id: "string",
  wizards: [Wizard],
});

exports.Player = Player;
