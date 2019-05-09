import { useEffect, useReducer } from 'react';

import { reducer, DEFAULT_STATE, ACTION_TYPES } from 'proton-shared/lib/authentication/loginReducer';
import {
    handleLoginAction,
    handleAuthAction,
    handleDeprecationAction,
    handleUnlockAction,
    handleFinalizeAction
} from 'proton-shared/lib/authentication/loginActions';

import useApi from '../../hooks/useApi';

const useLogin = ({ onLogin, ignoreUnlock }) => {
    const [state, dispatch] = useReducer(reducer, DEFAULT_STATE);
    const api = useApi();

    const handleLoginSubmit = ({ username, password }) => {
        dispatch({ type: ACTION_TYPES.SUBMIT_LOGIN, payload: { username, password, ignoreUnlock } });
    };

    const handleTotpSubmit = ({ totp }) => {
        dispatch({ type: ACTION_TYPES.SUBMIT_TOTP, payload: totp });
    };

    const handleUnlockSubmit = ({ password }) => {
        dispatch({ type: ACTION_TYPES.SUBMIT_UNLOCK, payload: password });
    };

    const actions = {
        [ACTION_TYPES.SUBMIT_LOGIN_EFFECT]: handleLoginAction,
        [ACTION_TYPES.SUBMIT_AUTH_EFFECT]: handleAuthAction,
        [ACTION_TYPES.PREPARE_DEPRECATION_EFFECT]: handleDeprecationAction,
        [ACTION_TYPES.SUBMIT_UNLOCK_EFFECT]: handleUnlockAction,
        [ACTION_TYPES.FINALIZE_EFFECT]: handleFinalizeAction
    };

    const { action, form, error } = state;

    useEffect(() => {
        if (!action) {
            return;
        }

        const abortController = new AbortController();

        actions[action](state, {
            api: (config) =>
                api({
                    ...config,
                    signal: abortController.signal
                })
        }).then((result) => {
            if (abortController.signal.aborted) {
                return;
            }
            if (result.type === ACTION_TYPES.DONE) {
                return onLogin(state);
            }
            dispatch(result);
        });

        return () => {
            abortController.abort();
        };
    }, [action]);

    return {
        loading: !!action,
        form,
        error,
        handleLoginSubmit,
        handleTotpSubmit,
        handleUnlockSubmit
    };
};

export default useLogin;
