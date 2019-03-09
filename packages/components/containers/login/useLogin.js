import { useEffect, useReducer } from 'react';
import { getInfo } from 'proton-shared/lib/api/auth';
import { handleAuthenticationToken } from 'proton-shared/lib/authentication/helpers';
import loginWithFallback from 'proton-shared/lib/authentication/loginWithFallback';

import { reducer, DEFAULT_STATE, ACTION_TYPES } from './loginReducer';
import useApi from '../../hooks/useApi';
import useSrp from '../../hooks/useSrp';

const useLogin = (onLogin) => {
    const [state, dispatch] = useReducer(reducer, DEFAULT_STATE);
    const api = useApi();
    const srp = useSrp();

    const handleLoginSubmit = ({ username, password }) => {
        dispatch({ type: ACTION_TYPES.SUBMIT_LOGIN, payload: { username, password } });
    };

    const handleTotpSubmit = ({ totp }) => {
        dispatch({ type: ACTION_TYPES.SUBMIT_TOTP, payload: totp });
    };

    const handleUnlockSubmit = ({ password }) => {
        dispatch({ type: ACTION_TYPES.SUBMIT_UNLOCK, payload: password });
    };

    const handleFinalizeAction = async (state, abortController) => {
        try {
            const {
                credentials: { mailboxPassword },
                authResult
            } = state;

            const result = await handleAuthenticationToken({
                abortController,
                api,
                mailboxPassword,
                authResult
            });

            onLogin({
                ...state,
                ...result
            });
        } catch (e) {
            if (e.name === 'PasswordError') {
                return dispatch({ type: ACTION_TYPES.RESET_UNLOCK });
            }
            dispatch({ type: ACTION_TYPES.RESET });
        }
    };

    const handleAuthAction = async (state, abortController) => {
        try {
            const { infoResult, credentials } = state;
            const loginResult = await loginWithFallback({
                abortController,
                api,
                srp,
                credentials,
                infoResult
            });
            dispatch({ type: ACTION_TYPES.SUBMIT_AUTH_EFFECT, payload: loginResult });
        } catch (e) {
            dispatch({ type: ACTION_TYPES.RESET });
        }
    };

    const handleLoginAction = async (state, abortController) => {
        try {
            const {
                credentials: { username }
            } = state;
            const infoConfig = getInfo(username);
            const infoResult = await api({
                ...infoConfig,
                signal: abortController.signal
            });
            dispatch({ type: ACTION_TYPES.SUBMIT_LOGIN_EFFECT, payload: infoResult });
        } catch (e) {
            dispatch({ type: ACTION_TYPES.RESET });
        }
    };

    const actions = {
        [ACTION_TYPES.SUBMIT_LOGIN_EFFECT]: handleLoginAction,
        [ACTION_TYPES.SUBMIT_AUTH_EFFECT]: handleAuthAction,
        [ACTION_TYPES.SUBMIT_FINALIZE_EFFECT]: handleFinalizeAction
    };

    const { action, form } = state;

    useEffect(() => {
        if (action) {
            const abortController = new AbortController();
            actions[action](state, abortController);
            return () => {
                abortController.abort();
            };
        }
    }, [action]);

    return {
        loading: !!action,
        form,
        handleLoginSubmit,
        handleTotpSubmit,
        handleUnlockSubmit
    };
};

export default useLogin;
