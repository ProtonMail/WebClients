/* @ngInject */
function SecurityController(
    $scope,
    activeSessionsModel,
    confirmModal,
    dispatchers,
    gettextCatalog,
    loginPasswordModal,
    networkActivityTracker,
    notification,
    recoveryCodeModal,
    settingsApi,
    userSettingsModel,
    sharedSecretModal,
    twoFAIntroModal,
    translator
) {

    const { on, unsubscribe } = dispatchers([]);

    const I18N = translator(() => ({
        twofa: {
            title: gettextCatalog.getString('Disable Two-Factor Authentication', null, 'Title'),
            message: gettextCatalog.getString(
                'Are you sure you want to disable two-factor authentication?',
                null,
                'Info'
            ),
            disabled: gettextCatalog.getString('Two-factor authentication disabled', null, 'Disable 2FA')
        },
        revoke: {
            successOthers: gettextCatalog.getString('Other sessions revoked', null, 'Success'),
            success: gettextCatalog.getString('Session revoked', null, 'Success')
        }
    }));

    const { TwoFactor } = userSettingsModel.get();

    $scope.activeSessions = activeSessionsModel.get();
    $scope.twoFactor = TwoFactor;

    function recoveryCodes(codes) {
        recoveryCodeModal.activate({
            params: {
                recoveryCodes: codes,
                close() {
                    recoveryCodeModal.deactivate();
                }
            }
        });
    }

    function confirm2FAEnable(sharedSecret, qrURI) {
        function submit(loginPassword, twoFactorCode) {
            const promise = settingsApi
                .enableTwoFactor(
                    { TwoFactorCode: twoFactorCode, Password: loginPassword },
                    { TwoFactorSharedSecret: sharedSecret }
                )
                .then((data = {}) => data.TwoFactorRecoveryCodes)
                .then((codes) => {
                    $scope.twoFactor = 1;
                    userSettingsModel.set('TwoFactor', 1);
                    recoveryCodes(codes);
                })
                .catch((err) => {
                    showSharedSecret(sharedSecret, qrURI);
                    throw err;
                });
            networkActivityTracker.track(promise);
        }
        checkCredentials2FA(submit);
    }

    function confirm2FADisable() {
        function submit(loginPassword, twoFactorCode) {
            const promise = settingsApi
                .disableTwoFactor({ TwoFactorCode: twoFactorCode, Password: loginPassword })
                .then(() => {
                    $scope.twoFactor = 0;
                    userSettingsModel.set('TwoFactor', 0);
                    notification.success(I18N.twofa.disabled);
                });

            networkActivityTracker.track(promise);
        }
        checkCredentials2FA(submit);
    }

    function checkCredentials2FA(submit) {
        loginPasswordModal.activate({
            params: {
                hasTwoFactor: 1, // force the modal to ask for 2FA code
                submit(loginPassword, twoFactorCode) {
                    loginPasswordModal.deactivate();
                    submit(loginPassword, twoFactorCode);
                },
                cancel() {
                    loginPasswordModal.deactivate();
                }
            }
        });
    }

    function showSharedSecret(sharedSecret, qrURI) {
        sharedSecretModal.activate({
            params: {
                sharedSecret,
                qrURI,
                next(sharedSecret, qrURI) {
                    sharedSecretModal.deactivate();
                    confirm2FAEnable(sharedSecret, qrURI);
                },
                cancel() {
                    sharedSecretModal.deactivate();
                }
            }
        });
    }

    $scope.enableTwoFactor = () => {
        twoFAIntroModal.activate({
            params: {
                next() {
                    showSharedSecret();
                    twoFAIntroModal.deactivate();
                },
                cancel() {
                    twoFAIntroModal.deactivate();
                }
            }
        });
    };

    $scope.disableTwoFactor = () => {
        confirmModal.activate({
            params: {
                title: I18N.twofa.title,
                message: I18N.twofa.message,
                confirm() {
                    confirmModal.deactivate();
                    confirm2FADisable();
                },
                cancel() {
                    confirmModal.deactivate();
                }
            }
        });
    };

    $scope.revokeOthers = () => {
        const promise = activeSessionsModel.revokeOthers().then(() => notification.success(I18N.revoke.successOthers));

        networkActivityTracker.track(promise);
    };

    $scope.revoke = (uid) => {
        const promise = activeSessionsModel.revoke(uid).then(() => notification.success(I18N.revoke.success));

        networkActivityTracker.track(promise);
    };

    on('activeSessions', (e, { type, data }) => {
        if (type === 'update') {
            $scope.activeSessions = data.sessions;
        }
    });

    $scope.$on('$destroy', () => {
        unsubscribe();
    });
}
export default SecurityController;
