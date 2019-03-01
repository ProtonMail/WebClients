import { ACTIONS } from './reducer';
import format from './format';

export const loadingAction = () => ({ type: ACTIONS.LOADING });
export const resetAction = () => ({ type: ACTIONS.RESET });
export const setAction = (data) => ({ type: ACTIONS.SET, payload: format(data) });
