import { SERVER_PORT } from "../../shared/config";

const SERVER_URL = `${location.protocol}//${location.hostname}`;

if (location.protocol !== "https:") {
  // ? check if not hosted
  SERVER_URL += `:${SERVER_PORT}`;
}

export { SERVER_URL };
