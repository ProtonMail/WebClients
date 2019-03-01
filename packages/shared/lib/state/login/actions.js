import { AUTH_VERSION } from 'pmcrypto';
import { ACTIONS } from './reducer';
import { cookies as cookiesRoute, info as infoRoute } from '../../api/auth';
import srpWithRetry from './srpWithRetry';
import { getRandomString } from '../../helpers/string';
import { passwordUpgrade } from '../../api/settings';
import { unlock } from '../../authentication';

export const DONE_AUTHENTICATED = 1;
export const DONE_SETUP = 2;

const hasTwoFactor = ({ '2FA': { TOTP } }) => {
    return !!TOTP;
};

const hasUnlock = ({ PasswordMode }) => {
    return PasswordMode !== 1;
};

const loadingAction = (payload = true) => {
    return {
        type: ACTIONS.LOADING,
        payload
    };
};

const showTwoFactorAction = (credentials, infoResult) => {
    return {
        type: ACTIONS.TWO_FA,
        payload: {
            credentials,
            infoResult
        }
    };
};

const showUnlockAction = (authResult, authVersion) => {
    return {
        type: ACTIONS.UNLOCK,
        payload: {
            authResult,
            authVersion
        }
    };
};

export const resetAction = () => {
    return {
        type: ACTIONS.RESET
    };
};

export const finalizeEffect = ({ UID, RefreshToken }, AccessToken, credentials, mailboxPassword, authVersion) => {
    return async (dispatch, getState, { api, srp, authenticationStore }) => {
        await api(
            cookiesRoute({
                UID,
                AuthToken: AccessToken,
                RefreshToken,
                State: getRandomString(24)
            })
        );

        authenticationStore.setUID(UID);
        authenticationStore.setPassword(mailboxPassword);

        if (authVersion < AUTH_VERSION) {
            await srp.init(credentials, passwordUpgrade());
        }

        return DONE_AUTHENTICATED;
    };
};

export const setupEffect = ({ UID, AccessToken, RefreshToken }) => {
    return async (dispatch, getState, { api, authenticationStore }) => {
        await api(
            cookiesRoute({
                UID,
                AuthToken: AccessToken,
                RefreshToken,
                State: getRandomString(24)
            })
        );

        authenticationStore.setUID(UID);

        return DONE_SETUP;
    };
};

export const authEffect = (credentials, infoResult) => {
    return async (dispatch, getState, { api, srp }) => {
        const { authVersion, result } = await srpWithRetry(api, srp, credentials, infoResult);

        const showUnlock = hasUnlock(result);
        if (showUnlock) {
            return dispatch(showUnlockAction(result, authVersion));
        }

        const { PrivateKey } = result;
        if (!PrivateKey) {
            return dispatch(setupEffect(result));
        }

        const { token, mailboxPassword } = await unlock(credentials.password, result);

        return dispatch(finalizeEffect(result, token, credentials, mailboxPassword, authVersion));
    };
};

export const unlockEffect = ({ password }) => {
    return async (dispatch, getState) => {
        try {
            dispatch(loadingAction());

            const {
                login: { credentials, authResult, authVersion }
            } = getState();

            const { token, mailboxPassword } = await unlock(password, authResult);

            return await dispatch(finalizeEffect(authResult, token, credentials, mailboxPassword, authVersion));
        } catch (e) {
            const { message = '' } = e;
            if (message.includes('Wrong mailbox password') || message.includes('Incorrect key passphrase')) {
                dispatch(loadingAction(false));
                return;
            }
            console.error(e);
            dispatch(resetAction());
        }
    };
};

export const loginTwoFaEffect = ({ twoFa }) => {
    return async (dispatch, getState) => {
        try {
            dispatch(loadingAction());

            const {
                login: { credentials, infoResult }
            } = getState();

            const newCredentials = {
                ...credentials,
                totp: twoFa
            };

            return await dispatch(authEffect(newCredentials, infoResult));
        } catch (e) {
            console.error(e);
            dispatch(resetAction());
        }
    };
};

export const loginEffect = (credentials) => {
    return async (dispatch, getState, { api }) => {
        try {
            dispatch(loadingAction());

            const { username } = credentials;
            const infoResult = await api(infoRoute(username));

            const showTwoFa = hasTwoFactor(infoResult);
            if (showTwoFa) {
                return dispatch(showTwoFactorAction(credentials, infoResult));
            }

            return await dispatch(authEffect(credentials, infoResult));
        } catch (e) {
            console.error(e);
            dispatch(resetAction());
        }
    };
};
