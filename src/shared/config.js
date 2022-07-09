// export const WORLD_SIZE = {
//   WIDTH: 1280,
//   HEIGHT: 720,
// };

// export const HUD_WIDTH = 500;
const SERVER_PORT = 8080;

const WORLD_SIZE = {
  WIDTH: 1280,
  HEIGHT: 720,
};

const HUD_WIDTH = 500;
const PLAYER_SIZE = 50;

const CHALLENGE_META = {
  x: HUD_WIDTH / 4 + WORLD_SIZE.WIDTH / 2,
  y: 100,
  size: 50,
};

const CHALLENGE_OBSTACLES = [
  {
    x: HUD_WIDTH / 4 + WORLD_SIZE.WIDTH / 2,
    y: WORLD_SIZE.HEIGHT / 2,
    size: 50,
  },
];

const CHALLENGE_PLAYER = {
  x: HUD_WIDTH / 4 + WORLD_SIZE.WIDTH / 2,
  y: WORLD_SIZE.HEIGHT - 100,
  size: PLAYER_SIZE,
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
