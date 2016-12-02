angular.module('proton.controllers.Settings')

.controller('SecurityController', (
    $log,
    $rootScope,
    $scope,
    twoFAIntroModal,
    gettextCatalog,
    authentication,
    confirmModal,
    CONSTANTS,
    sharedSecretModal,
    loginPasswordModal,
    recoveryCodeModal,
    Logs,
    networkActivityTracker,
    notify,
    Setting
) => {
    $scope.logs = [];
    $scope.logItemsPerPage = 20;
    $scope.doLogging = authentication.user.LogAuth;
    $scope.twoFactor = authentication.user.TwoFactor;
    $scope.keyPhase = CONSTANTS.KEY_PHASE;

    // / logging page
    $scope.disabledText = gettextCatalog.getString('Disable', null, 'Action');
    $scope.haveLogs = false;

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
            networkActivityTracker.track(
                Setting.enableTwoFactor({ TwoFactorSharedSecret: sharedSecret }, { TwoFactorCode: twoFactorCode, Password: loginPassword })
                .then((result) => {
                    if (result.data && result.data.Code === 1000) {
                        const codes = result.data.TwoFactorRecoveryCodes;
                        $scope.twoFactor = 1;
                        authentication.user.TwoFactor = 1;
                        recoveryCodes(codes);
                    } else if (result.data && result.data.Error) {
                        showSharedSecret(sharedSecret, qrURI);
                        return Promise.reject(result.data.Error);
                    }
                })
            );
        }
        checkCredentials2FA(submit);
    }

    function confirm2FADisable() {
        function submit(loginPassword, twoFactorCode) {
            networkActivityTracker.track(
                Setting.disableTwoFactor({ TwoFactorCode: twoFactorCode, Password: loginPassword })
                .then((result) => {
                    if (result.data && result.data.Code === 1000) {
                        $scope.twoFactor = 0;
                        authentication.user.TwoFactor = 0;
                        notify({ message: gettextCatalog.getString('Two-factor authentication disabled', null), classes: 'notification-success' });
                    } else if (result.data && result.data.Error) {
                        return Promise.reject(result.data.Error);
                    }
                })
            );
        }
        checkCredentials2FA(submit);
    }

    function checkCredentials2FA(submit) {
        loginPasswordModal.activate({
            params: {
                hasTwoFactor: 1,
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
        const title = gettextCatalog.getString('Disable Two-Factor Authentication', null, 'Title');
        const message = gettextCatalog.getString('Are you sure you want to disable two-factor authentication?', null, 'Info');
        confirmModal.activate({
            params: {
                title,
                message,
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
        $scope.currentLogPage = page;
    };

    $scope.initLogs = () => {
        networkActivityTracker.track(
            Logs.getLogs().then(
                (response) => {
                    $scope.logs = _.sortBy(response.data.Logs, 'Time').reverse();
                    $scope.logCount = $scope.logs.length;
                    $scope.currentLogPage = 1;
                    $scope.haveLogs = true;
                },
                (error) => {
                    notify({ message: gettextCatalog.getString('Error during the initialization of logs', null, 'Error'), classes: 'notification-danger' });
                    $log.error(error);
                }
            )
        );
    };

    $scope.clearLogs = () => {
        const title = gettextCatalog.getString('Clear', null, 'Title');
        const message = gettextCatalog.getString('Are you sure you want to clear all your logs?', null, 'Info');

        confirmModal.activate({
            params: {
                title,
                message,
                confirm() {
                    networkActivityTracker.track(
                        Logs.clearLogs()
                        .then((result) => {
                            if (result.data && result.data.Code === 1000) {
                                $scope.logs = [];
                                $scope.logCount = 0;
                                notify({ message: gettextCatalog.getString('Logs cleared', null), classes: 'notification-success' });
                            }
                        })
                    );
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

        window.saveAs(blob, filename);
    };

    $scope.setLogging = (value) => {
        if (value === 0) {
            confirmModal.activate({
                params: {
                    message: gettextCatalog.getString('Are you sure you want to clear all your logs?', null, 'Info'),
                    confirm() {
                        networkActivityTracker.track(
                            Setting.setLogging({ LogAuth: 0 })
                            .then((result) => {
                                if (result.data && result.data.Code === 1000) {
                                    $scope.doLogging = 0;
                                    authentication.user.LogAuth = 0;
                                    notify({ message: gettextCatalog.getString('Logging preference updated', null), classes: 'notification-success' });
                                    confirmModal.deactivate();
                                    $scope.disabledText = gettextCatalog.getString('Disabled', null);
                                } else if (result.data && result.data.Error) {
                                    notify({ message: result.data.Error, classes: 'notification-danger' });
                                }
                            })
                        );
                    },
                    cancel() {
                        confirmModal.deactivate();
                    }
                }
            });
        } else {
            networkActivityTracker.track(
                Setting.setLogging({ LogAuth: value })
                .then((result) => {
                    if (result.data && result.data.Code === 1000) {
                        $scope.doLogging = value;
                        authentication.user.LogAuth = value;
                        notify({ message: gettextCatalog.getString('Logging preference updated', null), classes: 'notification-success' });
                        $scope.disabledText = gettextCatalog.getString('Disable', null, 'Action');
                    } else if (result.data && result.data.Error) {
                        notify({ message: result.data.Error, classes: 'notification-danger' });
                    }
                })
            );
        }
    };
});
