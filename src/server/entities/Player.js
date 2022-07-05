const schema = require("@colyseus/schema");
const Schema = schema.Schema;
const ArraySchema = schema.ArraySchema;

const { Wizard } = require("./Wizard");

class Player extends Schema {
  constructor(id, name) {
    super();
    this.id = id;
    this.wizards = new ArraySchema(); // ! change to mapSchema // effect => this.wizards[id]
  }

  addWizards(wizardsState) {
    wizardsState.forEach((state, i) => {
      this.wizards.push(new Wizard(i.toString(), state.x, state.y, 50, "name"));
    });
    this.wizards[0].isSelected = true;
  }

  move(vectorX, vectorY, speed) {
    this.wizards
      .find((wizard) => wizard.isSelected)
      .move(vectorX, vectorY, speed);
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
