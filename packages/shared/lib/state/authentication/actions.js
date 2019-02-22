import { ACTIONS } from './reducer';

export const AUTHORIZING_ACTION = { type: ACTIONS.AUTHORIZING };

export const AUTHORIZED_ACTION = { type: ACTIONS.AUTHORIZED };

export const UNAUTHORIZED_ACTION = { type: ACTIONS.UNAUTHORIZED };

export const API_ERROR_ACTION = ({ code, message }) => ({
    type: 'API_ERROR',
    code,
    message
});
