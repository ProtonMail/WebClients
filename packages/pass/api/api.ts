import type { Api } from '../types';

export let api: Api;
export const exposeApi = (value: Api) => (api = value);
