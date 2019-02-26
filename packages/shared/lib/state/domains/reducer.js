import { createActions, createReducer } from '../model/reducerArray';

export const ACTIONS = createActions('DOMAINS');

export const reducer = createReducer(ACTIONS);
