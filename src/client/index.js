import Phaser from "phaser";
import World from "./scenes/world";
import Bootstrap from "./scenes/bootstrap";
import Challenge from "./scenes/challenge";
import Gui from "./scenes/gui";
import { WORLD_SIZE } from "../shared/config";
import Hud from "./scenes/hud";
import Preload from "./scenes/preload";

const config = {
  type: Phaser.AUTO,
  width: 1280,
  height: 720,
  parent: "game",
  dom: {
    createContainer: true,
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [Preload, Bootstrap, Gui, Hud, World, Challenge],
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
