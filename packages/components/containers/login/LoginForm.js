import React, { useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import { useApi, useLoading, LinkButton, PrimaryButton, useNotifications, useModals } from 'react-components';
import { getKeySalts } from 'proton-shared/lib/api/keys';
import { getUser } from 'proton-shared/lib/api/user';
import { auth2FA, getInfo, setCookies } from 'proton-shared/lib/api/auth';
import { upgradePassword } from 'proton-shared/lib/api/settings';
import loginWithFallback from 'proton-shared/lib/authentication/loginWithFallback';
import { getRandomString } from 'proton-shared/lib/helpers/string';
import { AUTH_VERSION } from 'pm-srp';
import { srpVerify } from 'proton-shared/lib/srp';
import { noop } from 'proton-shared/lib/helpers/function';
import { mergeHeaders } from 'proton-shared/lib/fetch/helpers';
import { getAuthHeaders } from 'proton-shared/lib/api';
import { HTTP_ERROR_CODES, API_CUSTOM_ERROR_CODES } from 'proton-shared/lib/errors';

const withAuthHeaders = (UID, AccessToken, config) => mergeHeaders(config, getAuthHeaders(UID, AccessToken));

import PasswordForm from './PasswordForm';
import TOTPForm from './TOTPForm';
import UnlockForm from './UnlockForm';
import { getAuthTypes, getErrorText, handleUnlockKey } from './helper';
import AbuseModal from './AbuseModal';

const FORM = {
    LOGIN: 0,
    TOTP: 1,
    U2F: 2,
    UNLOCK: 3
};

/** @type any */
const LoginForm = ({ onLogin, ignoreUnlock = false, needHelp }) => {
    const { createNotification } = useNotifications();
    const { createModal } = useModals();
    const cacheRef = useRef();
    const api = useApi();

    const [loading, withLoading] = useLoading();
    const [form, setForm] = useState(FORM.LOGIN);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [totp, setTotp] = useState('');
    const [keyPassword, setKeyPassword] = useState('');

    /**
     * Finalize login can be called without a key password in these cases:
     * 1) The admin panel
     * 2) Users who have no keys but are in 2-password mode
     * @param {String} [keyPassword]
     * @return {Promise}
     */
    const finalizeLogin = async (keyPassword) => {
        const {
            authVersion,
            authResult: { UID, EventID, AccessToken, RefreshToken },
            userSaltResult: [{ User }] = [{}] // Default for case 1)
        } = cacheRef.current;

        cacheRef.current = undefined;

        if (authVersion < AUTH_VERSION) {
            await srpVerify({
                api,
                credentials: { password },
                config: withAuthHeaders(UID, AccessToken, upgradePassword())
            });
        }

        await api(setCookies({ UID, AccessToken, RefreshToken, State: getRandomString(24) }));

        onLogin({ UID, User, keyPassword, EventID });
    };

    /**
     * Step 3. Handle unlock.
     * Attempt to decrypt the primary private key with the password.
     * @return {Promise}
     */
    const handleUnlock = async (password) => {
        const {
            userSaltResult: [{ User }, { KeySalts }]
        } = cacheRef.current;

        const { keyPassword } = await handleUnlockKey(User, KeySalts, password).catch(() => ({}));
        if (!keyPassword) {
            const error = new Error(c('Error').t`Wrong mailbox password`);
            error.name = 'PasswordError';
            throw error;
        }

        return finalizeLogin(keyPassword);
    };

    const next = async (previousForm) => {
        const {
            authResult,
            authResult: { UID, AccessToken }
        } = cacheRef.current;

        const { hasTotp, hasU2F, hasUnlock } = getAuthTypes(authResult);

        if (previousForm === FORM.LOGIN && hasTotp) {
            return setForm(FORM.TOTP);
        }

        if ((previousForm === FORM.LOGIN || previousForm === FORM.TOTP) && hasU2F) {
            return setForm(FORM.U2F);
        }

        // Special case for the admin panel, return early since it can not get key salts.
        if (ignoreUnlock) {
            return finalizeLogin();
        }

        /**
         * Handle the case for users who are in 2-password mode but have no keys setup.
         * Typically happens for VPN users.
         */
        const [{ User }] =
            cacheRef.current.userSaltResult ||
            (await Promise.all([
                api(withAuthHeaders(UID, AccessToken, getUser())),
                api(withAuthHeaders(UID, AccessToken, getKeySalts()))
            ]).then((result) => (cacheRef.current.userSaltResult = result)));

        if (User.Keys.length === 0) {
            return finalizeLogin();
        }

        if (hasUnlock) {
            return setForm(FORM.UNLOCK);
        }

        return handleUnlock(password);
    };

    /**
     * Step 2. Handle TOTP.
     * Unless there is another auth type active, the flow will continue until it's logged in.
     * @return {Promise}
     */
    const handleTotp = async () => {
        const {
            authResult: { UID, AccessToken }
        } = cacheRef.current;

        await api(withAuthHeaders(UID, AccessToken, auth2FA({ totp }))).catch((e) => {
            if (e.status === HTTP_ERROR_CODES.UNPROCESSABLE_ENTITY) {
                const error = new Error('Retry TOTP error');
                error.name = 'RetryTOTPError';
                error.data = e.data;
                throw error;
            }
            throw e;
        });

        return next(FORM.TOTP);
    };

    /**
     * Step 1. Handle the initial auth.
     * Unless there is an auth type active, the flow will continue until it's logged in.
     * @return {Promise}
     */
    const handleLogin = async () => {
        const infoResult = await api(getInfo(username));
        const { authVersion, result: authResult } = await loginWithFallback({
            api,
            credentials: { username, password },
            initalAuthInfo: infoResult
        });

        cacheRef.current = { authVersion, authResult };

        return next(FORM.LOGIN);
    };

    const handleCancel = () => {
        cacheRef.current = undefined;
        setForm(FORM.LOGIN);
        setPassword('');
        setTotp('');
        setKeyPassword('');
    };

    if (form === FORM.LOGIN) {
        const handleSubmit = (event) => {
            event.preventDefault();

            withLoading(
                handleLogin().catch((e) => {
                    cacheRef.current = undefined;
                    if (e.data && e.data.Code === API_CUSTOM_ERROR_CODES.AUTH_ACCOUNT_DISABLED) {
                        createModal(<AbuseModal />);
                    }
                })
            );
        };
        return (
            <form name="loginForm" onSubmit={handleSubmit}>
                <PasswordForm
                    username={username}
                    setUsername={loading ? noop : setUsername}
                    password={password}
                    setPassword={loading ? noop : setPassword}
                />
                <div className="flex flex-spacebetween">
                    {needHelp}
                    <PrimaryButton type="submit" loading={loading} data-cy-login="submit">
                        {c('Action').t`Log in`}
                    </PrimaryButton>
                </div>
            </form>
        );
    }

    const cancelButton = (
        <LinkButton type="reset" disabled={loading} onClick={handleCancel}>
            {c('Action').t`Cancel`}
        </LinkButton>
    );

    if (form === FORM.TOTP) {
        const handleSubmit = (event) => {
            event.preventDefault();

            withLoading(
                handleTotp().catch((e) => {
                    // In case of any other error than retry error, automatically cancel here to allow the user to retry.
                    if (e.name !== 'RetryTOTPError') {
                        return handleCancel();
                    }
                })
            );
        };
        return (
            <form name="totpForm" onSubmit={handleSubmit}>
                <TOTPForm totp={totp} setTotp={loading ? noop : setTotp} />
                <div className="flex flex-spacebetween">
                    {cancelButton}
                    <PrimaryButton type="submit" loading={loading} data-cy-login="submit TOTP">
                        {c('Action').t`Submit`}
                    </PrimaryButton>
                </div>
            </form>
        );
    }

    if (form === FORM.UNLOCK) {
        const handleSubmit = (event) => {
            event.preventDefault();

            withLoading(
                handleUnlock(keyPassword).catch((e) => {
                    // In case of any other error than password error, automatically cancel here to allow the user to retry.
                    if (e.name !== 'PasswordError') {
                        return handleCancel();
                    } else {
                        createNotification({ type: 'error', text: getErrorText(e) });
                    }
                })
            );
        };
        return (
            <form name="unlockForm" onSubmit={handleSubmit}>
                <UnlockForm password={keyPassword} setPassword={loading ? noop : setKeyPassword} />
                <div className="flex flex-spacebetween">
                    {cancelButton}
                    <PrimaryButton type="submit" loading={loading} data-cy-login="submit mailbox password">
                        {c('Action').t`Submit`}
                    </PrimaryButton>
                </div>
            </form>
        );
    }

    if (form === FORM.U2F) {
        return 'U2F not implemented';
    }

    throw new Error('Unsupported form');
};

LoginForm.propTypes = {
    onLogin: PropTypes.func.isRequired,
    needHelp: PropTypes.node,
    ignoreUnlock: PropTypes.bool
};

export default LoginForm;
