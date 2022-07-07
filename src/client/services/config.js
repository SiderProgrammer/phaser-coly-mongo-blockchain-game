// const host = window.document.location.host.replace(/:.*/, '');
// const port = process.env.NODE_ENV !== 'production' ? Constants.WS_PORT : window.location.port;
// const url = `${window.location.protocol.replace('http', 'ws')}//${host}${port ? `:${port}` : ''}`;
import { SERVER_PORT } from "../../shared/config";
export const SERVER_URL = `http://localhost:${SERVER_PORT}`;
