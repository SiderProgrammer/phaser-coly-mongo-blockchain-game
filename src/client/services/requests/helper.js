import { SERVER_URL } from "../config";

const headers = {
  "Content-Type": "application/json",
  Accept: "application/json",
};

export const postFunction = (data, url) => {
  return fetch(`${SERVER_URL}/${url}`, {
    method: "post",
    headers: headers,
    body: JSON.stringify(data),
  });
};

export const getFunction = (url) => {
  return fetch(`${SERVER_URL}/${url}`, {
    headers: headers,
  });
};
export async function fetchWithTimeout(resource, options) {
  const { timeout } = options;

  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  const response = await fetch(resource, {
    ...options,
    signal: controller.signal,
  });
  clearTimeout(id);

  return response;
}
