import type { Api } from '../../types/api/api';

export let api: Api;
export const exposeApi = (value: Api) => (api = value);
