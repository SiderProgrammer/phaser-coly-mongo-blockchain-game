// export const WORLD_SIZE = {
//   WIDTH: 1280,
//   HEIGHT: 720,
// };

// export const HUD_WIDTH = 500;
const SERVER_PORT = 8080;

const WORLD_SIZE = {
  WIDTH: 2048,
  HEIGHT: 2048,
};

const HUD_WIDTH = 500;
const PLAYER_SIZE = 32;

const CHALLENGE_META = {
  x: HUD_WIDTH / 4 + WORLD_SIZE.WIDTH / 2,
  y: 100,
  size: PLAYER_SIZE,
};

const CHALLENGE_OBSTACLES = [
  {
    x: HUD_WIDTH / 4 + WORLD_SIZE.WIDTH / 2,
    y: WORLD_SIZE.HEIGHT / 2,
    size: PLAYER_SIZE,
  },
];

const CHALLENGE_PLAYER = {
  x: HUD_WIDTH / 4 + WORLD_SIZE.WIDTH / 2,
  y: WORLD_SIZE.HEIGHT - 100,
};

module.exports = {
  WORLD_SIZE,
  HUD_WIDTH,
  CHALLENGE_OBSTACLES,
  CHALLENGE_META,
  CHALLENGE_PLAYER,
  PLAYER_SIZE,
  SERVER_PORT,
}; // TODO : change to imports & exports  (need to configure webpack for server)
