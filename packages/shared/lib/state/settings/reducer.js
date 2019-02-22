import { createActions, createReducer } from '../model/reducer';

export const ACTIONS = createActions('SETTINGS');

export const reducer = createReducer(ACTIONS);
