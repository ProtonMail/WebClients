import { createActions, createReducer } from '../model/reducerArray';

export const ACTIONS = createActions('CONTACT_EMAILS');

export const reducer = createReducer(ACTIONS);
