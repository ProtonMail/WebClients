export const ACTIONS = {
    AUTHORIZING: 'AUTHORIZING',
    AUTHORIZED: 'AUTHORIZED',
    UNAUTHORIZED: 'UNAUTHORIZED'
};

export const DEFAULT_STATE = {
    hasSession: false,
    loading: false
};

export default (state = DEFAULT_STATE, { type }) => {
    if (type === ACTIONS.UNAUTHORIZED) {
        return DEFAULT_STATE;
    }

    if (type === ACTIONS.AUTHORIZING) {
        return {
            hasSession: false,
            loading: true
        };
    }

    if (type === ACTIONS.AUTHORIZED) {
        return {
            hasSession: true,
            loading: false
        };
    }

    return state;
};
