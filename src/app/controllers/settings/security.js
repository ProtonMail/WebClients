angular.module("proton.controllers.Settings")

.controller('SecurityController', function(
    $log,
    $rootScope,
    $scope,
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
) {
    $scope.logs = [];
    $scope.logItemsPerPage = 20;
    $scope.doLogging = authentication.user.LogAuth;
    $scope.twoFactor = authentication.user.TwoFactor;
    $scope.keyPhase = CONSTANTS.KEY_PHASE;

    /// logging page
    $scope.disabledText = gettextCatalog.getString('Disable', null, 'Action');
    $scope.haveLogs = false;

    $scope.showSharedSecret = function() {
        const randomBytes = window.crypto.getRandomValues(new Uint8Array(20));
        const sharedSecret = base32.encode(randomBytes);
        let identifier = authentication.user.Name + '@protonmail';
        const primaryAddress = _.find(authentication.user.Addresses, () => true);
        if (primaryAddress) {
            identifier = primaryAddress.Email;
        }

        const qrURI = "otpauth://totp/" + identifier + "?secret=" + sharedSecret + "&issuer=protonmail&algorithm=SHA1&digits=6&period=30";

        sharedSecretModal.activate({
            params: {
                sharedSecret: sharedSecret,
                qrURI: qrURI,
                next: function() {
                    sharedSecretModal.deactivate();
                    $scope.confirm2FAEnable(sharedSecret, qrURI);
                },
                cancel: function() {
                    sharedSecretModal.deactivate();
                }
            }
        });
    };

    $scope.confirm2FAEnable = function(sharedSecret, qrURI) {
        function submit(loginPassword, twoFactorCode) {
            loginPasswordModal.deactivate();
            networkActivityTracker.track(
                Setting.enableTwoFactor(
                    { TwoFactorSharedSecret: sharedSecret },
                    { TwoFactorCode: twoFactorCode, Password: loginPassword }
                )
                .then(function(result) {
                    if (result.data && result.data.Code === 1000) {
                        var recoveryCodes = result.data.TwoFactorRecoveryCodes;
                        $scope.twoFactor = 1;
                        authentication.user.TwoFactor = 1;
                        $scope.recoveryCodes(recoveryCodes);
                    } else if (result.data && result.data.Error) {
                        notify({message: result.data.Error, classes: 'notification-danger'});
                        sharedSecretModal.activate({
                            params: {
                                sharedSecret: sharedSecret,
                                qrURI: qrURI,
                                next: function() {
                                    sharedSecretModal.deactivate();
                                    // open the next step
                                    $scope.confirm2FAEnable(sharedSecret, qrURI);
                                },
                                cancel: function() {
                                    sharedSecretModal.deactivate();
                                }
                            }
                        });
                    }
                })
            );
        }
        $scope.checkCredentials2FA(submit);
    };

    $scope.recoveryCodes = function(recoveryCodes) {
        var title = gettextCatalog.getString('Two-factor authentication enabled', null, 'Title');
        var message = gettextCatalog.getString('Keep these recovery codes in a safe place. If you lose your two factor enabled device, these one-time use codes can be used in the listed order to log in to your account.', null, 'Info');
        recoveryCodeModal.activate({
            params: {
                title: title,
                message: message,
                recoveryCodes: recoveryCodes,
                download: function() {
                    var blob = new Blob([recoveryCodes.join("\r\n")], { type: 'text/plain;charset=utf-8;' });
                    saveAs(blob, "protonmail_recovery_codes.txt");
                },
                done: function () {
                    recoveryCodeModal.deactivate();
                },
                cancel: function() {
                    recoveryCodeModal.deactivate();
                }
            }

        });

    };

    $scope.disableTwoFactor = function() {
        var title_confirm = gettextCatalog.getString('Disable Two-Factor Authentication', null, 'Title');
        var message = gettextCatalog.getString('Are you sure you want to disable two-factor authentication?', null, 'Info');
        var title_twofactor = gettextCatalog.getString('Confirm Disable Two-Factor Authentication');
        confirmModal.activate({
            params: {
                title: title_confirm,
                message: message,
                confirm: function() {
                    confirmModal.deactivate();
                    $scope.confirm2FADisable();
                },
                cancel: function() {
                    confirmModal.deactivate();
                }
            }
        });
    };

    $scope.confirm2FADisable = function() {
        function submit(loginPassword, twoFactorCode) {
            loginPasswordModal.deactivate();
             networkActivityTracker.track(
                Setting.disableTwoFactor({TwoFactorCode: twoFactorCode, Password: loginPassword})
                .then(function(result) {
                    if (result.data && result.data.Code === 1000) {
                        $scope.twoFactor = 0;
                        authentication.user.TwoFactor = 0;
                        notify({message: gettextCatalog.getString('Two-factor authentication disabled', null), classes: 'notification-success'});
                    } else if (result.data && result.data.Error) {
                        notify({message: result.data.Error, classes: 'notification-danger'});
                        $scope.disableTwoFactor();
                    }
                })
            );
        }
        $scope.checkCredentials2FA(submit);
    };

    $scope.checkCredentials2FA = function(submit) {
        loginPasswordModal.activate({
            params: {
                submit: submit,
                cancel: function() {
                    loginPasswordModal.deactivate();
                },
                hasTwoFactor: 1
            }
        });
    };

    $scope.loadLogs = function (page) {
        $scope.currentLogPage = page;
    };

    $scope.initLogs = function() {
        networkActivityTracker.track(
            Logs.getLogs().then(
                function(response) {
                    $scope.logs = _.sortBy(response.data.Logs, 'Time').reverse();
                    $scope.logCount = $scope.logs.length;
                    $scope.currentLogPage = 1;
                    $scope.haveLogs = true;
                },
                function(error) {
                    notify({message: gettextCatalog.getString('Error during the initialization of logs', null, 'Error'), classes: 'notification-danger'});
                    $log.error(error);
                }
            )
        );
    };

    $scope.clearLogs = function() {
        var title = gettextCatalog.getString('Clear', null, 'Title');
        var message = gettextCatalog.getString('Are you sure you want to clear all your logs?', null, 'Info');

        confirmModal.activate({
            params: {
                title: title,
                message: message,
                confirm: function() {
                    networkActivityTracker.track(
                        Logs.clearLogs()
                        .then(function(result) {
                            if (result.data && result.data.Code === 1000) {
                                $scope.logs = [];
                                $scope.logCount = 0;
                                notify({message: gettextCatalog.getString('Logs cleared', null), classes: 'notification-success'});
                            } else {

                            }
                        })
                    );
                    confirmModal.deactivate();
                },
                cancel: function() {
                    confirmModal.deactivate();
                }
            }
        });
    };

    $scope.downloadLogs = function () {
        var logsArray = [['Event', 'Time', 'IP']];
        var csvRows = [];
        var filename = 'logs.csv';

        _.forEach($scope.logs, function(log) {
          logsArray.push([log.Event, moment(log.Time * 1000), log.IP]);
        });

        for(var i=0, l=logsArray.length; i<l; ++i) {
            csvRows.push(logsArray[i].join(','));
        }

        var csvString = csvRows.join("\r\n");
        var blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });

        saveAs(blob, filename);
    };

    $scope.setLogging = function(value) {
        if (value === 0) {
            confirmModal.activate({
                params: {
                    message: gettextCatalog.getString('Are you sure you want to clear all your logs?', null, 'Info'),
                    confirm: function() {
                        networkActivityTracker.track(
                            Setting.setLogging({LogAuth: 0})
                            .then(function(result) {
                                if (result.data && result.data.Code === 1000) {
                                    $scope.doLogging = 0;
                                    authentication.user.LogAuth = 0;
                                    notify({message: gettextCatalog.getString('Logging preference updated', null), classes: 'notification-success'});
                                    confirmModal.deactivate();
                                    $scope.disabledText = gettextCatalog.getString('Disabled', null);
                                } else if (result.data && result.data.Error) {
                                    notify({message: result.data.Error, classes: 'notification-danger'});
                                }
                            })
                        );
                    },
                    cancel: function() {
                        confirmModal.deactivate();
                    }
                }
            });
        } else {
            networkActivityTracker.track(
                Setting.setLogging({LogAuth: value})
                .then(function(result) {
                    if (result.data && result.data.Code === 1000) {
                        $scope.doLogging = value;
                        authentication.user.LogAuth = value;
                        notify({message: gettextCatalog.getString('Logging preference updated', null), classes: 'notification-success'});
                        $scope.disabledText = gettextCatalog.getString('Disable', null, 'Action');
                    } else if (result.data && result.data.Error) {
                        notify({message: result.data.Error, classes: 'notification-danger'});
                    }
                })
            );
        }
    };

    $scope.exportPublicKey = function (clickEvent) {
        var element = angular.element(clickEvent.target);
        var pbk = authentication.user.PublicKey;
        var blob = new Blob([pbk], { type: 'data:text/plain;charset=utf-8;' });
        var filename = 'protonmail_public_' + authentication.user.Name + '.txt';

        try {
            saveAs(blob, filename);
        } catch (e) {
            $log.error(e);
        } finally {
            $log.debug('saveAs');
        }
    };

    // NOT USED
    $scope.exportEncPrivateKey = function () {
        var pbk = authentication.user.EncPrivateKey;
        var blob = new Blob([pbk], { type: 'data:text/plain;charset=utf-8;' });
        var filename = 'protonmail_private_'+authentication.user.Name+'.txt';

        saveAs(blob, filename);
    };
});
