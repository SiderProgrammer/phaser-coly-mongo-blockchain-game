const fs = require("fs");

// TODO : I need make mapManager handle .json files instead of .js,
// TODO  thanks to this we will have only one tilemap file on client-side instead of .json & .js

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

// const challengesLength = 1;

// for (let i = 0; i < challengesLength; i++) {
//   removeLethalsAndSave("src/client/assets/tilemaps/sampleMapChallenge_" + i + ".json");
// }

// removeLethalsAndSave("assets/tilemaps/sampleMap.json");
// removeLethalsAndSave("assets/tilemaps/sampleMap.json");

removeLethalsAndSave("src/client/assets/tilemaps/sampleMapChallenge.json");
removeLethalsAndSave("src/client/assets/tilemaps/sampleMap.json");
