import { SERVER_PORT } from "../../shared/config";

let SERVER_URL = `${location.protocol}//${location.hostname}`;

if (location.protocol !== "https:") {
  // ? check if not hosted
  SERVER_URL += `:${SERVER_PORT}`;
}

//const WEBSOCKET_URL = location.origin.replace(/^http/, "ws");
const WEBSOCKET_URL = `ws://${location.hostname};`; // TODO : fix it

export { SERVER_URL, WEBSOCKET_URL };
