import { createActions, createReducer } from '../model/reducer';

export const ACTIONS = createActions('KEYS');

export const reducer = createReducer(ACTIONS);
