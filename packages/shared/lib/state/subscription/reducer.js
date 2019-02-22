import { createActions, createReducer } from '../model/reducer';

export const ACTIONS = createActions('SUBSCRIPTION');

export const reducer = createReducer(ACTIONS);
