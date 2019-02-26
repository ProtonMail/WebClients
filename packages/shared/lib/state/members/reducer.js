import { createActions, createReducer } from '../model/reducerArray';

export const ACTIONS = createActions('MEMBERS');

export const reducer = createReducer(ACTIONS);
