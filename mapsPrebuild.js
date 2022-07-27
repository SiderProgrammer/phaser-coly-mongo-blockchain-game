const fs = require("fs");

function removeLethalsAndSave(JSONfile) {
  fs.readFile(JSONfile, "utf-8", (err, data) => {
    const splittedText = data.split("{");

    const spliceIndex = splittedText.findIndex((text) =>
      text.includes("lethals")
    );
    if (spliceIndex === -1) return;
    splittedText.splice(spliceIndex, 1);
    const newFile = splittedText.join("{");

    fs.writeFile(JSONfile, newFile, "utf-8", function (err) {
      console.log(err);
    });
  });
}

const mapsLength = 1;

for (let i = 0; i < mapsLength; i++) {
  removeLethalsAndSave(__dirname + "assets/tilemaps/sampleMap_" + i + ".json");
}
