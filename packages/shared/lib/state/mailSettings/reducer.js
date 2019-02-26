import { createActions, createReducer } from '../model/reducer';

export const ACTIONS = createActions('MAIL_SETTINGS');

export const reducer = createReducer(ACTIONS);
