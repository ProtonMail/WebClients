import { createActions, createReducer } from '../model/reducer';

export const ACTIONS = createActions('USER');

export const reducer = createReducer(ACTIONS);
