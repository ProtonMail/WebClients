import type { Api } from '@proton/pass/types';

export let api: Api;
export const exposeApi = (value: Api) => (api = value);
