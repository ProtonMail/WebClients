angular.module('proton.controllers.Settings')

.controller('AccountController', function(
    $log,
    $rootScope,
    $scope,
    $timeout,
    CONSTANTS,
    gettextCatalog,
    $q,
    authentication,
    changeMailboxPassword,
    Bug,
    confirmModal,
    deleteAccountModal,
    desktopNotifications,
    eventManager,
    hotkeys,
    hotkeyModal,
    Key,
    loginPasswordModal,
    networkActivityTracker,
    notify,
    passwords,
    pmcw,
    Setting,
    Organization,
    tools,
    User
) {
    const unsubscribe = [];
    $scope.signatureContent = CONSTANTS.PM_SIGNATURE;
    $scope.displayName = authentication.user.DisplayName;
    $scope.PMSignature = Boolean(authentication.user.PMSignature);
    $scope.notificationEmail = authentication.user.NotificationEmail;
    $scope.dailyNotifications = !!authentication.user.Notify;
    $scope.desktopNotificationsStatus = desktopNotifications.status();
    $scope.autosaveContacts = !!authentication.user.AutoSaveContacts;
    $scope.images = authentication.user.ShowImages;
    $scope.embedded = authentication.user.ShowEmbedded;
    $scope.hotkeys = authentication.user.Hotkeys;
    $scope.signature = tools.replaceLineBreaks(authentication.user.Signature);
    $scope.passwordMode = authentication.user.PasswordMode;
    $scope.keyPhase = CONSTANTS.KEY_PHASE;
    $scope.twoFactor = authentication.user.TwoFactor;

    function passwordModal(submit) {
        loginPasswordModal.activate({
            params: {
                submit: submit,
                cancel: function() {
                    loginPasswordModal.deactivate();
                },
                hasTwoFactor: authentication.user.TwoFactor
            }
        });
    }

    $scope.setPasswordMode = function(mode = 0) {
        $scope.passwordMode = mode;
    };

    // Listeners
    unsubscribe.push($rootScope.$on('changePMSignature', changePMSignature));
    $scope.$on('$destroy', () => {
        unsubscribe.forEach(cb => cb());
        unsubscribe.length = 0;
    });

    $scope.enableDesktopNotifications = function() {
        desktopNotifications.request(function() {
            $scope.desktopNotificationsStatus = desktopNotifications.status();
        });
    };

    $scope.testDesktopNotification = function() {
        desktopNotifications.create(gettextCatalog.getString('You have a new email', null, 'Info'), {
            body: 'Quarterly Operations Update - Q1 2016 ',
            icon: '/assets/img/notification-badge.gif',
            onClick: function(event) {
                window.focus();
            }
        });
    };

    $scope.saveNotification = function(form) {

        function submit(currentPassword, twoFactorCode) {
            loginPasswordModal.deactivate();


            networkActivityTracker.track(
                Setting.noticeEmail(
                    {
                        NotificationEmail: $scope.notificationEmail
                    },
                    {
                        Password: currentPassword,
                        TwoFactorCode: twoFactorCode
                    }
                )
                .then(function(result) {
                    authentication.user.NotificationEmail = $scope.notificationEmail;
                    form.$setUntouched();
                    notify({message: gettextCatalog.getString('Notification email saved', null), classes: 'notification-success'});
                })
            )
            .catch((error) => {
                // Nothing
            });
        }

        passwordModal(submit);
    };

    $scope.saveDailyNotifications = function(form) {
        var value = $scope.dailyNotifications;

        networkActivityTracker.track(
          Setting.notify({Notify: $scope.dailyNotifications})
          .then(function(result) {
              if (result.data && result.data.Code === 1000) {
                  authentication.user.Notify = $scope.dailyNotifications;
                  notify({message: gettextCatalog.getString('Preference saved', null), classes: 'notification-success'});
              } else if (result.data && result.data.Error) {
                  notify({message: result.data.Error, classes: 'notification-danger'});
              }
          })
        );
    };

    $scope.saveLoginPassword = function(form) {
        const newLoginPwd = $scope.newLoginPassword;
        const confLoginPwd = $scope.confirmLoginPassword;

        function submit(currentPassword, twoFactorCode) {
            loginPasswordModal.deactivate();

            networkActivityTracker.track(
                Setting.password({
                    Password: currentPassword,
                    TwoFactorCode: twoFactorCode
                },
                newLoginPwd).then(function(result) {
                    $scope.newLoginPassword = '';
                    $scope.confirmLoginPassword = '';
                    form.$setUntouched();
                    authentication.user.PasswordMode = 2;
                    notify({message: gettextCatalog.getString('Login password updated', null), classes: 'notification-success'});
                })
            )
            .catch((error) => {
                // Nothing
            });
        }

        passwordModal(submit);
    };

    $scope.saveMailboxPassword = function(form) {
        const newPassword = $scope.newMailboxPassword;
        const confNewPassword = $scope.confirmMailboxPassword;

        function submit(currentPassword, twoFactorCode) {
            loginPasswordModal.deactivate();

            changeMailboxPassword(
                {
                    currentPassword,
                    newPassword,
                    twoFactorCode,
                    onePassword: false
                })
            .then(() => {
                $scope.newMailboxPassword = '';
                $scope.confirmMailboxPassword = '';
                form.$setUntouched();
                authentication.user.PasswordMode = 2;
                notify({message: gettextCatalog.getString('Mailbox password updated', null), classes: 'notification-success'});
            })
            .catch((error) => {
                // Nothing
            });
        }

        passwordModal(submit);
    };

    $scope.savePassword = function(form) {
        const newPassword = $scope.newPassword;
        const confNewPassword = $scope.confirmPassword;

        function submit(currentPassword, twoFactorCode) {
            loginPasswordModal.deactivate();

            changeMailboxPassword(
                {
                    currentPassword,
                    newPassword,
                    twoFactorCode,
                    onePassword: true
                })
            .then(() => {
                $scope.newPassword = '';
                $scope.confirmPassword = '';
                form.$setUntouched();
                authentication.user.PasswordMode = 1;
                notify({message: gettextCatalog.getString('Password updated', null), classes: 'notification-success'});
            })
            .catch((error) => {
                // Nothing
            });
        }

        passwordModal(submit);
    };

    $scope.saveIdentity = function() {
        var deferred = $q.defer();
        var displayName = $scope.displayName;
        var signature = $scope.signature;

        signature = signature.replace(/\n/g, '<br />');


        $q.all({
            displayName: Setting.display({DisplayName: displayName}),
            signature: Setting.signature({Signature: signature})
        })
        .then(function(result) {
            if (result.displayName.data.Code === 1000 && result.signature.data.Code === 1000) {
                notify({message: gettextCatalog.getString('Identity saved', null), classes: 'notification-success'});
                eventManager.call()
                .then(function() {
                    deferred.resolve();
                });
            } else if (result.signature.data.Code === 12010) {
                notify({message: gettextCatalog.getString('Unable to save your changes, your signature is too large.', null, 'Error'), classes: 'notification-danger'});
                deferred.reject();
            } else {
                notify({message: gettextCatalog.getString('Unable to save your changes, please try again.', null, 'Error'), classes: 'notification-danger'});
                deferred.reject();
            }
        }, function() {
            notify({message: gettextCatalog.getString('Unable to save your changes, please try again.', null, 'Error'), classes: 'notification-danger'});
            deferred.reject();
        });

        return networkActivityTracker.track(deferred.promise);
    };


    function changePMSignature(event, status) {
        const PMSignature = (status) ? 1 : 0;
        const promise = Setting.PMSignature({PMSignature})
        .then((result) => {
            if (result.data && result.data.Code === 1000) {
                return eventManager.call()
                .then(() => {
                    notify({message: gettextCatalog.getString('Signature updated', null, 'Info'), classes: 'notification-success'});
                });
            } else if (result.data && result.data.Error) {
                return Promise.reject(result.data.Error);
            }
        });

        networkActivityTracker.track(promise);

        return promise;
    }

    $scope.saveAutosaveContacts = function(form) {
        networkActivityTracker.track(
            Setting.autosave({AutoSaveContacts: $scope.autosaveContacts})
            .then(function(result) {
                notify({message: gettextCatalog.getString('Preference saved', null), classes: 'notification-success'});
                authentication.user.AutoSaveContacts = $scope.autosaveContacts;
            })
        );
    };

    $scope.saveImages = function(form) {
        networkActivityTracker.track(
            Setting.setShowImages({ShowImages: $scope.images})
            .then(function(result) {
                authentication.user.ShowImages = $scope.images;
                notify({message: gettextCatalog.getString('Image preferences updated', null), classes: 'notification-success'});
            })
        );
    };

    $scope.saveEmbedded = function() {
        networkActivityTracker.track(
            Setting.setShowEmbedded({ShowEmbedded: $scope.embedded})
            .then(function(result) {
                authentication.user.ShowEmbedded = $scope.embedded;
                notify({message: gettextCatalog.getString('Image preferences updated', null), classes: 'notification-success'});
            })
        );
    };

    $scope.openHotkeyModal = function() {
        hotkeyModal.activate({
            params: {
                close: function() {
                    hotkeyModal.deactivate();
                }
            }
        });
    };

    $scope.saveHotkeys = function() {
        networkActivityTracker.track(
            Setting.setHotkeys({Hotkeys: $scope.hotkeys})
            .then(function(result) {
                if (result.data && result.data.Code === 1000) {
                    authentication.user.Hotkeys = $scope.hotkeys;

                    if ($scope.hotkeys === 1) {
                        hotkeys.bind();
                    } else {
                        hotkeys.unbind();
                    }

                    notify({message: gettextCatalog.getString('Hotkeys preferences updated', null), classes: 'notification-success'});
                } else if (result.data && result.data.Error) {
                    notify({message: result.data.Error, classes: 'notification-danger'});
                }
            })
        );
    };

    $scope.deleteAccount = function() {
        deleteAccountModal.activate({
            params: {
                submit: function(password, feedback) {
                    Bug.report({
                        OS: '--',
                        OSVersion: '--',
                        Browser: '--',
                        BrowserVersion: '--',
                        BrowserExtensions: '--',
                        Client: '--',
                        ClientVersion: '--',
                        Title: '[DELETION FEEDBACK]',
                        Username: '--',
                        Email: '--',
                        Description: feedback
                    }).then(function(result) {
                        if (result.data && result.data.Code === 1000) {
                            User.delete({Password: password})
                            .then(function(result) {
                                if (result.data && result.data.Code === 1000) {
                                    deleteAccountModal.deactivate();
                                    $rootScope.logout();
                                } else if (result.data && result.data.Error) {
                                    notify({message: result.data.Error, classes: 'notification-danger'});
                                }
                            });
                        } else if (result.data && result.data.Error) {
                            notify({message: result.data.Error, classes: 'notification-danger'});
                        }
                    });
                },
                cancel: function() {
                    deleteAccountModal.deactivate();
                }
            }
        });
    };
});
