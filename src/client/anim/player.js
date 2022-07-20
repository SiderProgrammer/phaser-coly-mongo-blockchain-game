const frameRate = 4;

export default function initPlayerAnims(scene) {
  const anims = [
    {
      key: "idle",
      frames: scene.anims.generateFrameNumbers("player", { start: 0, end: 0 }),
    },
    {
      key: "walk-down",
      frames: scene.anims.generateFrameNumbers("player", { start: 0, end: 3 }),
      frameRate,
    },
    {
      key: "walk-left",
      frames: scene.anims.generateFrameNumbers("player", { start: 4, end: 7 }),
      frameRate,
    },
    {
      key: "walk-right",
      frames: scene.anims.generateFrameNumbers("player", { start: 8, end: 11 }),
      frameRate,
    },
    {
      key: "walk-up",
      frames: scene.anims.generateFrameNumbers("player", {
        start: 12,
        end: 15,
      }),
      frameRate,
    },
  ];

  anims.forEach((anim) => scene.anims.create(anim));
}
