import { hasUnlock, hasTotp } from 'proton-shared/lib/authentication/helpers';

export const FORM = {
    LOGIN: 0,
    TOTP: 1,
    UNLOCK: 2
};

export const DEFAULT_STATE = {
    form: FORM.LOGIN
};

export const ACTION_TYPES = {
    RESET: -1,
    SUBMIT_LOGIN: 0,
    SUBMIT_LOGIN_EFFECT: 1,
    SUBMIT_TOTP: 2,
    SUBMIT_AUTH_EFFECT: 3,
    SUBMIT_UNLOCK: 4,
    RESET_UNLOCK: 5,
    SUBMIT_UNLOCK_EFFECT: 6,
    SUBMIT_FINALIZE_EFFECT: 7
};

export const reducer = (state, action) => {
    if (action.type === ACTION_TYPES.RESET) {
        return {
            ...DEFAULT_STATE
        };
    }

    if (action.type === ACTION_TYPES.SUBMIT_LOGIN) {
        return {
            action: ACTION_TYPES.SUBMIT_LOGIN_EFFECT,
            form: state.form,
            credentials: {
                username: action.payload.username,
                password: action.payload.password
            }
        };
    }

    if (action.type === ACTION_TYPES.SUBMIT_LOGIN_EFFECT) {
        const infoResult = action.payload;
        const showTotp = hasTotp(infoResult);

        const rest = showTotp
            ? {
                  form: FORM.TOTP
              }
            : {
                  form: state.form,
                  action: ACTION_TYPES.SUBMIT_AUTH_EFFECT
              };

        return {
            ...rest,
            credentials: state.credentials,
            infoResult
        };
    }

    if (action.type === ACTION_TYPES.SUBMIT_TOTP) {
        return {
            action: ACTION_TYPES.SUBMIT_AUTH_EFFECT,
            form: state.form,
            credentials: {
                ...state.credentials,
                totp: action.payload
            },
            infoResult: state.infoResult
        };
    }

    if (action.type === ACTION_TYPES.SUBMIT_AUTH_EFFECT) {
        const { authVersion, result: authResult } = action.payload;
        const showUnlock = hasUnlock(authResult);

        const rest = showUnlock
            ? {
                  form: FORM.UNLOCK,
                  credentials: state.credentials
              }
            : {
                  form: state.form,
                  action: ACTION_TYPES.SUBMIT_FINALIZE_EFFECT,
                  credentials: {
                      ...state.credentials,
                      mailboxPassword: state.credentials.password
                  }
              };

        return {
            ...rest,
            infoResult: state.infoResult,
            authVersion,
            authResult
        };
    }

    if (action.type === ACTION_TYPES.SUBMIT_UNLOCK) {
        return {
            action: ACTION_TYPES.SUBMIT_FINALIZE_EFFECT,
            form: state.form,
            credentials: {
                ...state.credentials,
                mailboxPassword: action.payload
            },
            infoResult: state.infoResult,
            authVersion: state.authVersion,
            authResult: state.authResult
        };
    }

    if (action.type === ACTION_TYPES.RESET_UNLOCK) {
        return {
            ...state,
            form: FORM.UNLOCK,
            action: undefined
        };
    }

    throw new Error('Unsupported action');
};
