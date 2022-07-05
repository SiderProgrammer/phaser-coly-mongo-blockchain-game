import { getFunction, postFunction } from "./helper";

export const CREATE_PLAYER = (data) => {
  return postFunction(data, "createPlayer");
};

export const GET_PLAYER = (data) => {
  return postFunction(data, "getPlayer");
};

export const GET_ALL_PLAYERS = () => {
  return getFunction("getAllPlayers");
};
