import { START_EVENT_MANAGER, STOP_EVENT_MANAGER, GET_EVENTS } from './actionTypes';

export const start = (latestEventID) => ({ type: START_EVENT_MANAGER, payload: latestEventID });
export const stop = () => ({ type: STOP_EVENT_MANAGER });
export const get = () => ({ type: GET_EVENTS });
