import { createActions, createReducer } from '../model/reducerArray';

export const ACTIONS = createActions('NOTICES');

export const reducer = createReducer(ACTIONS);
