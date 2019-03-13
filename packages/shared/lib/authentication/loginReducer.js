import { hasUnlock, hasTotp } from './helpers';

export const FORM = {
    LOGIN: 0,
    TOTP: 1,
    UNLOCK: 2
};

export const DEFAULT_STATE = {
    form: FORM.LOGIN
};

export const ACTION_TYPES = {
    ERROR: -1,
    SUBMIT_LOGIN: 0,
    SUBMIT_LOGIN_EFFECT: 1,
    SUBMIT_TOTP: 2,
    SUBMIT_AUTH_EFFECT: 3,
    SUBMIT_UNLOCK: 4,
    RESET_UNLOCK: 5,
    SUBMIT_UNLOCK_EFFECT: 6,
    PREPARE_DEPRECATION_EFFECT: 7,
    FINALIZE_EFFECT: 8,
    DONE: 9
};

export const reducer = (state, action) => {
    if (action.type === ACTION_TYPES.ERROR) {
        const error = action.payload;

        if (error.name === 'PasswordError') {
            return {
                ...state,
                form: FORM.UNLOCK,
                action: undefined,
                error
            };
        }

        return {
            ...DEFAULT_STATE,
            error
        };
    }

    if (action.type === ACTION_TYPES.SUBMIT_LOGIN) {
        return {
            action: ACTION_TYPES.SUBMIT_LOGIN_EFFECT,
            form: state.form,
            error: undefined,
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
            ...state,
            error: undefined,
            action: ACTION_TYPES.SUBMIT_AUTH_EFFECT,
            credentials: {
                ...state.credentials,
                totp: action.payload
            }
        };
    }

    if (action.type === ACTION_TYPES.SUBMIT_AUTH_EFFECT) {
        const { authVersion, result: authResult } = action.payload;
        const needsUnlock = hasUnlock(authResult);

        const rest = (() => {
            // TODO: --Remove this once it's been deprecated in the API.
            const { PrivateKey, KeySalt } = authResult;
            if (PrivateKey && needsUnlock) {
                return {
                    action: undefined,
                    form: FORM.UNLOCK,
                    primaryKey: {
                        PrivateKey,
                        KeySalt
                    }
                };
            }
            if (PrivateKey) {
                return {
                    action: ACTION_TYPES.SUBMIT_UNLOCK_EFFECT,
                    credentials: {
                        ...state.credentials,
                        mailboxPassword: state.credentials.password
                    },
                    primaryKey: {
                        PrivateKey,
                        KeySalt
                    }
                };
            }
            // TODO: --Remove this once it's been deprecated in the API.

            return {
                action: ACTION_TYPES.PREPARE_DEPRECATION_EFFECT
            };
        })();

        return {
            form: state.form,
            credentials: state.credentials,
            ...rest,
            infoResult: state.infoResult,
            authVersion,
            authResult
        };
    }

    if (action.type === ACTION_TYPES.PREPARE_DEPRECATION_EFFECT) {
        const needsUnlock = hasUnlock(state.authResult);

        const rest = (({ PrivateKey, KeySalt }) => {
            if (PrivateKey && needsUnlock) {
                return {
                    action: undefined,
                    form: FORM.UNLOCK,
                    primaryKey: {
                        PrivateKey,
                        KeySalt
                    }
                };
            }

            if (PrivateKey) {
                return {
                    action: ACTION_TYPES.SUBMIT_UNLOCK_EFFECT,
                    credentials: {
                        ...state.credentials,
                        mailboxPassword: state.credentials.password
                    },
                    primaryKey: {
                        PrivateKey,
                        KeySalt
                    }
                };
            }

            return {
                action: ACTION_TYPES.FINALIZE_EFFECT
            };
        })(action.payload.primaryKey);

        return {
            ...state,
            ...rest,
            userResult: action.payload.User
        };
    }

    if (action.type === ACTION_TYPES.SUBMIT_UNLOCK) {
        return {
            ...state,
            error: undefined,
            action: ACTION_TYPES.SUBMIT_UNLOCK_EFFECT,
            credentials: {
                ...state.credentials,
                mailboxPassword: action.payload
            }
        };
    }

    if (action.type === ACTION_TYPES.SUBMIT_UNLOCK_EFFECT) {
        return {
            ...state,
            action: ACTION_TYPES.FINALIZE_EFFECT,
            credentials: {
                ...state.credentials,
                keyPassword: action.payload
            }
        };
    }

    throw new Error('Unsupported action');
};
