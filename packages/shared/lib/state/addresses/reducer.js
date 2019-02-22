import { createActions, createReducer } from '../model/reducerArray';

export const ACTIONS = createActions('ADDRESSES');

export const reducer = createReducer(ACTIONS);
