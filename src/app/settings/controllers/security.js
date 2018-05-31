import _ from 'lodash';

/* @ngInject */
function SecurityController(
    $log,
    $rootScope,
    $scope,
    authApi,
    authentication,
    confirmModal,
    downloadFile,
    gettextCatalog,
    loginPasswordModal,
    Logs,
    networkActivityTracker,
    notification,
    recoveryCodeModal,
    settingsApi,
    userSettingsModel,
    sharedSecretModal,
    twoFAIntroModal
) {
    const I18N = {
        clear: {
            title: gettextCatalog.getString('Clear', null, 'Title'),
            message: gettextCatalog.getString('Are you sure you want to clear all your logs?', null, 'Info'),
            updated: gettextCatalog.getString('Logging preference updated', null, 'Dashboard/security'),
            disable: gettextCatalog.getString('Disable', null, 'Action'),
            disabled: gettextCatalog.getString('Disabled', null, 'Action'),
            success: gettextCatalog.getString('Logs cleared', null, "Clear user's logs (security)")
        },
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
            success: gettextCatalog.getString('Other sessions revoked', null, 'Success'),
            error: gettextCatalog.getString('Error during revoke request', null, 'Error')
        },
        logging: {
            success: gettextCatalog.getString('Logging preference updated', null, 'Dashboard/security'),
            error: gettextCatalog.getString('Error during the initialization of logs', null, 'Error'),
            disable: gettextCatalog.getString('Disable', null, 'Action')
        }
    };

    const { LogAuth, TwoFactor } = userSettingsModel.get();

    $scope.logs = [];
    $scope.logItemsPerPage = 20;
    $scope.doLogging = LogAuth;
    $scope.twoFactor = TwoFactor;

    // / logging page
    $scope.disabledText = I18N.clear.disable;
    $scope.haveLogs = false;

    const setCurrentPage = (p) => {
        $scope.currentLogPage = p;
        $rootScope.$emit('paginatorScope', { type: 'logs', page: p });
    };

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
                    { TwoFactorSharedSecret: sharedSecret },
                    { TwoFactorCode: twoFactorCode, Password: loginPassword }
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

    $scope.loadLogs = (page) => {
        setCurrentPage(page);
    };

    $scope.initLogs = () => {
        networkActivityTracker.track(
            Logs.get().then(
                (response) => {
                    $scope.logs = _.sortBy(response.data.Logs, 'Time').reverse();
                    $scope.logCount = $scope.logs.length;
                    setCurrentPage(1);
                    $scope.haveLogs = true;
                },
                (error) => {
                    notification.error(I18N.logging.error);
                    $log.error(error);
                }
            )
        );
    };

    $scope.clearLogs = () => {
        confirmModal.activate({
            params: {
                title: I18N.clear.title,
                message: I18N.clear.message,
                confirm() {
                    const promise = Logs.clear().then(() => {
                        $scope.logs = [];
                        $scope.logCount = 0;
                        notification.success(I18N.clear.success);
                    });

                    networkActivityTracker.track(promise);
                    confirmModal.deactivate();
                },
                cancel() {
                    confirmModal.deactivate();
                }
            }
        });
    };

    $scope.downloadLogs = () => {
        const logsArray = [['Event', 'Time', 'IP']];
        const csvRows = [];
        const filename = 'logs.csv';

        _.forEach($scope.logs, (log) => {
            logsArray.push([log.Event, moment(log.Time * 1000), log.IP]);
        });

        for (let i = 0, l = logsArray.length; i < l; ++i) {
            csvRows.push(logsArray[i].join(','));
        }

        const csvString = csvRows.join('\r\n');
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });

        downloadFile(blob, filename);
    };

    $scope.revokeOthers = () => {
        const promise = authApi
            .revokeOthers()
            .then(() => notification.success(I18N.revoke.success))
            .catch(({ data = {} } = {}) => {
                throw new Error(data.Error || I18N.revoke.error);
            });

        networkActivityTracker.track(promise);
    };

    $scope.setLogging = (value) => {
        if (value === 0) {
            return confirmModal.activate({
                params: {
                    title: I18N.clear.title,
                    message: I18N.clear.message,
                    confirm() {
                        const promise = settingsApi.setLogging({ LogAuth: 0 }).then(() => {
                            $scope.doLogging = 0;
                            notification.success(I18N.clear.updated);
                            confirmModal.deactivate();
                            $scope.disabledText = I18N.clear.disabled;
                        });
                        networkActivityTracker.track(promise);
                    },
                    cancel() {
                        confirmModal.deactivate();
                    }
                }
            });
        }

        const promise = settingsApi.setLogging({ LogAuth: value }).then(() => {
            $scope.doLogging = value;
            notification.success(I18N.logging.success);
            $scope.disabledText = I18N.logging.disable;
        });

        networkActivityTracker.track(promise);
    };
}
export default SecurityController;
