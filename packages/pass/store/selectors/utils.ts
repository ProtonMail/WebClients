import type { State } from '../types';

export const selectState = (state: State) => state;

const EMPTY_LIST: any[] = [];
export const NOOP_LIST_SELECTOR = <T>() => EMPTY_LIST as T[];
