import SoundManager from "../components/SoundManager";

export default class Preload extends Phaser.Scene {
  constructor() {
    super("preload");
  }

  preload() {
    this.createLoadingScreen();

    this.load.plugin(
      "rexinputtextplugin",
      "https://raw.githubusercontent.com/rexrainbow/phaser3-rex-notes/master/dist/rexinputtextplugin.min.js",
      true
    );
    this.load.plugin(
      "rexninepatchplugin",
      "https://raw.githubusercontent.com/rexrainbow/phaser3-rex-notes/master/dist/rexninepatchplugin.min.js",
      true
    );
    this.load.setPath("./src/client/assets/");
    this.load.image("logo", "logo.png");
    this.load.image("green", "green.png");
    this.load.image("red", "red.png");
    this.load.image("white", "white.png");
    this.load.image("wizard", "wizard.png");
    this.load.image("challengeButton", "challengeButton.png");
    this.load.image("checkmark", "checkmark.png");
    this.load.image("gear", "gear.png");
    this.load.image("inputBox", "inputBox.png");
    this.load.spritesheet("player", "player.png", {
      frameWidth: 32,
      frameHeight: 32,
    });

    this.load.tilemapTiledJSON("worldMap", `tilemaps/sampleMap.json`);
    this.load.tilemapTiledJSON(
      "challengeMap",
      `tilemaps/sampleMapChallenge.json`
    );
    this.load.image("tiles32x32", `tilesets/tiles32x32.png`);

    this.audioData = SoundManager.getAudioData();

    for (const audio in this.audioData) {
      this.load.audio(
        this.audioData[audio].key,
        this.audioData[audio].filePath
      );
    }
  }

  create() {
    for (const audio in this.audioData) {
      SoundManager.add(this, this.audioData[audio]);
    }
    this.scene.start("bootstrap");
  }

  createLoadingScreen() {
    var width = this.cameras.main.width;
    var height = this.cameras.main.height;

    var progressBar = this.add.graphics();
    var progressBox = this.add.graphics();
    progressBox.fillStyle(0x222222, 0.8);
    progressBox.fillRect(240, 270, 320, 50);

    
    var loadingText = this.make.text({
      x: width / 2,
      y: height / 2 - 50,
      text: "Loading...",
      style: {
        font: "20px monospace",
        fill: "#ffffff",
      },
    });
    loadingText.setOrigin(0.5, 0.5);

    var percentText = this.make.text({
      x: width / 2,
      y: height / 2 - 5,
      text: "0%",
      style: {
        font: "18px monospace",
        fill: "#ffffff",
      },
    });
    percentText.setOrigin(0.5, 0.5);

    var assetText = this.make.text({
      x: width / 2,
      y: height / 2 + 50,
      text: "",
      style: {
        font: "18px monospace",
        fill: "#ffffff",
      },
    });
    assetText.setOrigin(0.5, 0.5);

    this.load.on("progress", function (value) {
      percentText.setText(parseInt(value * 100) + "%");
      progressBar.clear();
      progressBar.fillStyle(0xffffff, 1);
      progressBar.fillRect(250, 280, 300 * value, 30);
    });

    this.load.on("fileprogress", function (file) {
      assetText.setText("Loading asset: " + file.key);
    });
    this.load.on("complete", function () {
      progressBar.destroy();
      progressBox.destroy();
      loadingText.destroy();
      percentText.destroy();
      assetText.destroy();
    });
  }
}
