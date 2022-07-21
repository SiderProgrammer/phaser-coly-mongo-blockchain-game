import { requestGet, requestPost } from "./helper";
// TODO : remove not used
export const CREATE_PLAYER = (data) => {
  return requestPost(data, "createPlayer");
};

export const GET_PLAYER = (data) => {
  return requestPost(data, "getPlayer");
};
export const CHANGE_NAME = (data) => {
  return requestPost(data, "changeName");
};
export const GET_ALL_PLAYERS = () => {
  return requestGet("getAllPlayers");
};
export const GET_ALL_COLLECTED_OBJECTS = () => {
  return requestGet("getAllCollectedObjects");
};

export const GET_GAME_STATE = () => {
  return requestGet("getGameState");
};
