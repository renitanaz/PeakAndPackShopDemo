// Where the API lives. By default, the backend this run started itself.
export const API = process.env.API_URL ?? `http://localhost:${process.env.BACKEND_PORT ?? 3001}`;
