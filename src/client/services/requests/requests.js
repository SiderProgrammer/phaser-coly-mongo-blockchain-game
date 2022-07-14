import { requestGet, requestPost } from "./helper";

export const CREATE_PLAYER = (data) => {
  return requestPost(data, "createPlayer");
};

export const GET_PLAYER = (data) => {
  return requestPost(data, "getPlayer");
};

export const GET_ALL_PLAYERS = () => {
  return requestGet("getAllPlayers");
};

export const GET_GAME_STATE = () => {
  return requestGet("getGameState");
};
