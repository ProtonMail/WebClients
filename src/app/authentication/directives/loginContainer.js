import loginWithFallback from 'proton-shared/lib/authentication/loginWithFallback';
import { getPrimaryKeyWithSalt } from 'proton-shared/lib/keys/keys';
import { AUTH_VERSION, computeKeyPassword } from 'pm-srp';
import { decryptPrivateKey } from 'pmcrypto';

import { getAuthHeaders } from '../services/authApi';

const FORM = {
    LOGIN: 'LOGIN',
    TOTP: 'TOTP',
    U2F: 'U2F',
    UNLOCK: 'UNLOCK'
};

export const getAuthTypes = ({ '2FA': { Enabled }, PasswordMode } = {}) => {
    return {
        hasTotp: Enabled & 1,
        hasU2F: Enabled & 2,
        hasUnlock: PasswordMode !== 1
    };
};

export const handleUnlockKey = async (User, KeySalts, rawKeyPassword) => {
    const { KeySalt, PrivateKey } = getPrimaryKeyWithSalt(User.Keys, KeySalts);

    // Support for versions without a key salt.
    const keyPassword = KeySalt ? await computeKeyPassword(rawKeyPassword, KeySalt) : rawKeyPassword;
    const primaryKey = await decryptPrivateKey(PrivateKey, keyPassword).catch(() => {
        const error = new Error('Wrong private key password');
        error.name = 'PasswordError';
        throw error;
    });

    return { primaryKey, keyPassword };
};

/* @ngInject */
const loginContainer = (
    $state,
    eventManager,
    authApi,
    compatApi,
    tempStorage,
    AppModel,
    settingsApi,
    notification,
    User,
    Key,
    translator,
    gettextCatalog,
    networkActivityTracker,
    authentication,
    domainApi
) => {
    const userApi = User;
    const keysApi = Key;

    const I18N = translator(() => ({
        PASSWORD_ERROR: gettextCatalog.getString('Incorrect decryption password', null, 'Error')
    }));

    const track = networkActivityTracker.track;

    domainApi.available({ params: { Type: 'login' }, noNotify: true });

    const handleSuccess = ({ UID, EventID, User, mailboxPassword, plainMailboxPassword }) => {
        tempStorage.setItem('plainMailboxPass', plainMailboxPassword);
        tempStorage.setItem('userResult', User);

        authentication.setUID(UID);
        authentication.setPassword(mailboxPassword);

        eventManager.initialize(EventID);

        $state.go('secured.inbox');
    };

    const setBodyUnlock = (value) => {
        AppModel.set('isUnlock', value);
    };

    return {
        replace: true,
        restrict: 'E',
        templateUrl: require('../../../templates/views/login.tpl.html'),
        link(scope) {
            let state = {};

            const show = (type) => {
                scope.$applyAsync(() => {
                    scope.show = type;
                    setBodyUnlock(type === FORM.UNLOCK || type === 'DECRYPTING');
                });
            };

            scope.show = FORM.LOGIN;
            scope.username = '';

            const finalizeLogin = async (plainMailboxPassword, mailboxPassword) => {
                const {
                    authVersion,
                    authResult: { UID, AccessToken, RefreshToken, EventID },
                    userSaltResult: [User],
                    password
                } = state;

                state = undefined;

                const authHeaders = getAuthHeaders({ UID, AccessToken });

                if (authVersion < AUTH_VERSION) {
                    await settingsApi.passwordUpgrade({ Password: password }, {}, authHeaders);
                }

                await authApi.cookies({ UID, AccessToken, RefreshToken }, authHeaders);
                show('DECRYPTING');
                handleSuccess({ UID, User, mailboxPassword, plainMailboxPassword, EventID });
            };

            /**
             * Step 3. Handle unlock.
             * Attempt to decrypt the primary private key with the password.
             * @param {String} password
             * @return {Promise}
             */
            const handleUnlock = async (password) => {
                const {
                    userSaltResult: [User, { KeySalts }]
                } = state;

                const { keyPassword } = await handleUnlockKey(User, KeySalts, password);
                return finalizeLogin(password, keyPassword);
            };

            const next = async (previousForm) => {
                const {
                    authResult,
                    authResult: { UID, AccessToken },
                    password
                } = state;
                const { hasTotp, hasU2F, hasUnlock } = getAuthTypes(authResult);

                if (previousForm === FORM.LOGIN && hasTotp) {
                    return show(FORM.TOTP);
                }

                if ((previousForm === FORM.LOGIN || previousForm === FORM.TOTP) && hasU2F) {
                    return show(FORM.U2F);
                }

                /**
                 * Handle the case for users who are in 2-password mode but have no keys setup.
                 * Typically happens for VPN users.
                 */
                const authHeaders = getAuthHeaders({ UID, AccessToken });
                const [User] =
                    state.userSaltResult ||
                    (await Promise.all([userApi.get(authHeaders), keysApi.salts(authHeaders)]).then(
                        (result) => (state.userSaltResult = result)
                    ));

                if (User.Keys.length === 0) {
                    return finalizeLogin();
                }

                if (hasUnlock) {
                    return show(FORM.UNLOCK);
                }

                return handleUnlock(password);
            };

            /**
             * Step 2. Handle TOTP.
             * Unless there is another auth type active, the flow will continue until it's logged in.
             * @param {String} totp
             * @return {Promise}
             */
            const handleTotp = async (totp) => {
                const {
                    authResult: { UID, AccessToken }
                } = state;

                await authApi.auth2fa({ TwoFactorCode: totp }, getAuthHeaders({ UID, AccessToken })).catch((e) => {
                    e.canRetryTOTP = e.status === 422;
                    throw e;
                });

                return next(FORM.TOTP);
            };

            /**
             * Step 1. Handle the initial auth.
             * Unless there is an auth type active, the flow will continue until it's logged in.
             * @param {String} username
             * @param {String} password
             * @return {Promise}
             */
            const handleLogin = async (username, password) => {
                const infoResult = await authApi.info(username);
                const { authVersion, result: authResult } = await loginWithFallback({
                    api: compatApi,
                    credentials: { username, password },
                    initalAuthInfo: infoResult
                });

                state = { authVersion, authResult, username, password };

                return next(FORM.LOGIN);
            };

            const handleCancel = () => {
                scope.$applyAsync(() => {
                    scope.username = state.username;
                });
                state = {};
                show(FORM.LOGIN);
            };

            scope.onCancel = handleCancel;

            scope.onSubmitLogin = async ({ username, password }) => {
                if (networkActivityTracker.loading()) {
                    return;
                }
                track(
                    handleLogin(username, password).catch((e) => {
                        state = {};
                        // Api error, already shown
                        if (!e || !e.message || e.status) {
                            return;
                        }
                        notification.error(e.message);
                    })
                );
            };

            scope.onSubmitTotp = async ({ totp }) => {
                if (networkActivityTracker.loading()) {
                    return;
                }
                track(
                    handleTotp(totp).catch((e) => {
                        if (!e.canRetryTOTP) {
                            return handleCancel();
                        }
                    })
                );
            };

            scope.onSubmitUnlock = async ({ password }) => {
                if (networkActivityTracker.loading()) {
                    return;
                }
                track(
                    handleUnlock(password).catch((e) => {
                        if (e.name !== 'PasswordError') {
                            handleCancel();
                        } else {
                            notification.error(I18N.PASSWORD_ERROR);
                        }
                    })
                );
            };

            scope.$on('$destroy', () => {
                setBodyUnlock(false);
                state = undefined;
            });
        }
    };
};

export default loginContainer;
