import Phaser from "phaser";
import World from "./scenes/world";
import Bootstrap from "./scenes/bootstrap";
import Challenge from "./scenes/challenge";
import Hud from "./scenes/hud";
import { WORLD_SIZE } from "../shared/config";

const config = {
  type: Phaser.AUTO,
  parent: "game",
  width: WORLD_SIZE.WIDTH,
  height: WORLD_SIZE.HEIGHT,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [Bootstrap, Hud, World, Challenge],
};

// ? just for dev purposes
const address = document.getElementById("wallet-address");
const confirm = document.getElementById("confirm-address");

confirm.onclick = () => {
  window.walletAddress = address.value;
  address.style.display = "none";
  confirm.style.display = "none";

  new Phaser.Game(config);
};
