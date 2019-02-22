import { ACTIONS } from './reducer';

export const loadingAction = () => ({ type: ACTIONS.LOADING });
export const resetAction = () => ({ type: ACTIONS.RESET });
export const updateAction = (data) => ({ type: ACTIONS.UPDATE, payload: data });
export const setAction = (data) => ({ type: ACTIONS.SET, payload: data });