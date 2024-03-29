// export const WORLD_SIZE = {
//   WIDTH: 1280,
//   HEIGHT: 720,
// };

// export const HUD_WIDTH = 500;
// ! neeed to hide some data from public files
const SERVER_PORT = 8080;

const WORLD_SIZE = {
  WIDTH: 2048,
  HEIGHT: 2048,
};

const VIEWPORT_SIZE = {
  WIDTH: 1280,
  HEIGHT: 720,
};

const HUD_WIDTH = 250; // TODO : change to GUT_WIDTH
const HUD_HEIGHT = 70;
const DAILY_MAX_MOVES = 20;

const PLAYER_SIZE = 32;
const TILE_SIZE = 32;
const PRE_MOVE_DISTANCE = 5;
const WORLD_COLUMNS_COUNT = WORLD_SIZE.WIDTH / TILE_SIZE;
const WORLD_ROWS_COUNT = WORLD_SIZE.HEIGHT / TILE_SIZE;

const CHALLENGE_META = {
  x: HUD_WIDTH / 2 + VIEWPORT_SIZE.WIDTH / 2,
  y: VIEWPORT_SIZE.HEIGHT - 300,
  size: PLAYER_SIZE,
};

const CHALLENGE_OBSTACLES = [
  {
    x: HUD_WIDTH / 2 + VIEWPORT_SIZE.WIDTH / 2,
    y: VIEWPORT_SIZE.HEIGHT - 200,
    size: PLAYER_SIZE,
  },
];

const CHALLENGE_PLAYER = {
  c: 18,
  r: 20,
};

module.exports = {
  WORLD_SIZE,
  HUD_WIDTH,
  CHALLENGE_OBSTACLES,
  CHALLENGE_META,
  CHALLENGE_PLAYER,
  PLAYER_SIZE,
  SERVER_PORT,
  TILE_SIZE,
  HUD_HEIGHT,
  PRE_MOVE_DISTANCE,
  WORLD_COLUMNS_COUNT,
  WORLD_ROWS_COUNT,
  DAILY_MAX_MOVES,
}; // TODO : change to imports & exports  (need to configure webpack for server)
