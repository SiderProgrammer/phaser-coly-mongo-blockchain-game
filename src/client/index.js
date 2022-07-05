import Phaser from "phaser";
import World from "./scenes/world";
import Bootstrap from "./scenes/bootstrap";
import Challenge from "./scenes/challenge";
import Hud from "./scenes/hud";

const config = {
  type: Phaser.AUTO,
  parent: "phaser-example",
  width: 800,
  height: 600,
  scale: {
    mode: Phaser.Scale.FIT,
  },
  scene: [Bootstrap, Hud, World, Challenge],
};

new Phaser.Game(config);
