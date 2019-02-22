import { createActions, createReducer } from '../model/reducer';

export const ACTIONS = createActions('ORGANIZATION');

export const reducer = createReducer(ACTIONS);
