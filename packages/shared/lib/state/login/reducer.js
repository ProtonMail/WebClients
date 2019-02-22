export const ACTIONS = {
    RESET: 'LOGIN_RESET',
    LOADING: 'LOGIN_LOADING',
    TWO_FA: 'LOGIN_TWOFA',
    UNLOCK: 'LOGIN_UNLOCK'
};

export const STEPS = {
    LOGIN: 'login',
    TWO_FA: '2fa',
    UNLOCK: 'unlock'
};

export const DEFAULT_STATE = {
    step: STEPS.LOGIN,
    loading: false
};

export default (state = DEFAULT_STATE, { type, payload }) => {
    if (type === ACTIONS.RESET) {
        return DEFAULT_STATE;
    }

    if (type === ACTIONS.LOADING) {
        return {
            ...state,
            loading: payload
        };
    }

    if (type === ACTIONS.TWO_FA) {
        const { credentials, infoResult } = payload;

        return {
            step: STEPS.TWO_FA,
            credentials,
            infoResult,
            loading: false
        };
    }

    if (type === ACTIONS.UNLOCK) {
        const { authResult, authVersion } = payload;

        return {
            step: STEPS.UNLOCK,
            authResult,
            authVersion,
            loading: false
        };
    }

    return state;
};
