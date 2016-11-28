angular.module('proton.controllers.Settings')

.controller('AccountController', (
    $log,
    $rootScope,
    $scope,
    $timeout,
    $state,
    CONSTANTS,
    gettextCatalog,
    $q,
    authentication,
    changePasswordModal,
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
) => {
    let promisePasswordModal;
    const unsubscribe = [];
    $scope.signatureContent = CONSTANTS.PM_SIGNATURE;
    $scope.displayName = authentication.user.DisplayName;
    $scope.PMSignature = Boolean(authentication.user.PMSignature);
    $scope.notificationEmail = authentication.user.NotificationEmail;
    $scope.passwordReset = !!authentication.user.PasswordReset;
    $scope.dailyNotifications = authentication.user.Notify;
    $scope.desktopNotificationsStatus = desktopNotifications.status();
    $scope.autosaveContacts = !!authentication.user.AutoSaveContacts;
    $scope.images = authentication.user.ShowImages;
    $scope.embedded = authentication.user.ShowEmbedded;
    $scope.hotkeys = authentication.user.Hotkeys;
    $scope.signature = tools.replaceLineBreaks(authentication.user.Signature);
    $scope.passwordMode = authentication.user.PasswordMode;
    $scope.keyPhase = CONSTANTS.KEY_PHASE;
    updateUser();

    function passwordModal(submit) {
        loginPasswordModal.activate({
            params: {
                submit,
                hasTwoFactor: authentication.user.TwoFactor,
                cancel() {
                    loginPasswordModal.deactivate();
                }
            }
        });
    }

    $scope.setPasswordMode = (mode = 0) => {
        $scope.passwordMode = mode;
    };

    // Listeners
    unsubscribe.push($rootScope.$on('changePMSignature', changePMSignature));
    unsubscribe.push($rootScope.$on('updateUser', updateUser));
    $scope.$on('$destroy', () => {
        unsubscribe.forEach((cb) => cb());
        unsubscribe.length = 0;
    });

    $scope.enableDesktopNotifications = () => {
        desktopNotifications.request(() => {
            $scope.desktopNotificationsStatus = desktopNotifications.status();
        });
    };

    $scope.testDesktopNotification = () => {
        desktopNotifications.create(gettextCatalog.getString('You have a new email', null, 'Info'), {
            body: 'Quarterly Operations Update - Q1 2016 ',
            icon: '/assets/img/notification-badge.gif',
            onClick() {
                window.focus();
            }
        });
    };

    $scope.saveNotification = (form) => {
        function submit(currentPassword, twoFactorCode) {
            loginPasswordModal.deactivate();

            const credentials = {
                Password: currentPassword,
                TwoFactorCode: twoFactorCode
            };

            networkActivityTracker.track(
                $q.when()
                .then(() => {
                    if ($scope.notificationEmail !== authentication.user.NotificationEmail) {
                        return Setting.noticeEmail({
                            NotificationEmail: $scope.notificationEmail
                        }, credentials);
                    }
                })
                .then(() => {
                    if ($scope.passwordReset !== authentication.user.PasswordReset) {
                        return Setting.passwordReset({
                            PasswordReset: $scope.passwordReset ? 1 : 0
                        }, credentials);
                    }
                })
                .then(() => {
                    authentication.user.NotificationEmail = $scope.notificationEmail;
                    authentication.user.PasswordReset = $scope.passwordReset;
                    form.$setUntouched();
                    form.$setPristine();
                    notify({
                        message: gettextCatalog.getString('Notification email saved', null),
                        classes: 'notification-success'
                    });
                })
            )
            .catch((error) => {
                notify({ message: error, classes: 'notification-danger' });
            });
        }

        passwordModal(submit);
    };

    $scope.saveDailyNotifications = () => {
        networkActivityTracker.track(
          Setting.notify({ Notify: $scope.dailyNotifications })
          .then((result) => {
              if (result.data && result.data.Code === 1000) {
                  authentication.user.Notify = $scope.dailyNotifications;
                  notify({ message: gettextCatalog.getString('Preference saved', null), classes: 'notification-success' });
              } else if (result.data && result.data.Error) {
                  notify({ message: result.data.Error, classes: 'notification-danger' });
              }
          })
        );
    };

    function initAutoClose() {
        const tenMinutes = 10 * 60 * 1000;
        $timeout.cancel(promisePasswordModal);
        promisePasswordModal = $timeout(() => {
            if (changePasswordModal.active()) {
                const message = gettextCatalog.getString('', null);
                changePasswordModal.deactivate();
                notify({ message, classes: 'notification-danger' });
            }
        }, tenMinutes);
    }

    function cancelAutoClose() {
        $timeout.cancel(promisePasswordModal);
    }

    $scope.changePassword = (type = '', phase = 0) => {
        function submit(currentPassword, twoFactorCode) {
            const promise = User.password({ Password: currentPassword, TwoFactorCode: twoFactorCode })
            .then((result) => {
                const { data } = result;
                if (data.Error) {
                    return Promise.reject(data.Error);
                }
                return Promise.resolve(result);
            })
            .then(() => {
                loginPasswordModal.deactivate();
                initAutoClose();
                changePasswordModal.activate({
                    params: {
                        phase,
                        type,
                        close() {
                            changePasswordModal.deactivate();
                            if (phase === 1) {
                                $scope.changePassword('mailbox', 2);
                            } else {
                                cancelAutoClose();
                            }
                        }
                    }
                });
            });
            networkActivityTracker.track(promise);
        }
        if (phase !== 2) {
            passwordModal(submit);
        }
    };

    $scope.saveIdentity = () => {
        const deferred = $q.defer();
        const displayName = $scope.displayName;
        let signature = $scope.signature;

        signature = signature.replace(/\n/g, '<br />');


        $q.all({
            displayName: Setting.display({ DisplayName: displayName }),
            signature: Setting.signature({ Signature: signature })
        })
        .then((result) => {
            if (result.displayName.data.Code === 1000 && result.signature.data.Code === 1000) {
                notify({ message: gettextCatalog.getString('Identity saved', null), classes: 'notification-success' });
                eventManager.call()
                .then(() => {
                    deferred.resolve();
                });
            } else if (result.signature.data.Code === 12010) {
                notify({ message: gettextCatalog.getString('Unable to save your changes, your signature is too large.', null, 'Error'), classes: 'notification-danger' });
                deferred.reject();
            } else {
                notify({ message: gettextCatalog.getString('Unable to save your changes, please try again.', null, 'Error'), classes: 'notification-danger' });
                deferred.reject();
            }
        }, () => {
            notify({ message: gettextCatalog.getString('Unable to save your changes, please try again.', null, 'Error'), classes: 'notification-danger' });
            deferred.reject();
        });

        return networkActivityTracker.track(deferred.promise);
    };

    function updateUser() {
        $scope.displayName = authentication.user.DisplayName;
        $scope.PMSignature = Boolean(authentication.user.PMSignature);
        $scope.notificationEmail = authentication.user.NotificationEmail;
        $scope.passwordReset = Boolean(authentication.user.PasswordReset);
        $scope.dailyNotifications = Boolean(authentication.user.Notify);
        $scope.desktopNotificationsStatus = desktopNotifications.status();
        $scope.autosaveContacts = Boolean(authentication.user.AutoSaveContacts);
        $scope.images = authentication.user.ShowImages;
        $scope.embedded = authentication.user.ShowEmbedded;
        $scope.hotkeys = authentication.user.Hotkeys;
        $scope.signature = tools.replaceLineBreaks(authentication.user.Signature);
        $scope.passwordMode = authentication.user.PasswordMode;
    }

    function changePMSignature(event, status) {
        const PMSignature = (status) ? 1 : 0;
        const promise = Setting.PMSignature({ PMSignature })
        .then((result) => {
            if (result.data && result.data.Code === 1000) {
                return eventManager.call()
                .then(() => {
                    notify({ message: gettextCatalog.getString('Signature updated', null, 'Info'), classes: 'notification-success' });
                });
            } else if (result.data && result.data.Error) {
                return Promise.reject(result.data.Error);
            }
        });

        networkActivityTracker.track(promise);

        return promise;
    }

    $scope.saveAutosaveContacts = () => {
        networkActivityTracker.track(
            Setting.autosave({ AutoSaveContacts: $scope.autosaveContacts })
            .then(() => {
                notify({ message: gettextCatalog.getString('Preference saved', null), classes: 'notification-success' });
                authentication.user.AutoSaveContacts = $scope.autosaveContacts;
            })
        );
    };

    $scope.saveImages = () => {
        networkActivityTracker.track(
            Setting.setShowImages({ ShowImages: $scope.images })
            .then(() => {
                authentication.user.ShowImages = $scope.images;
                notify({ message: gettextCatalog.getString('Image preferences updated', null), classes: 'notification-success' });
            })
        );
    };

    $scope.saveEmbedded = () => {
        networkActivityTracker.track(
            Setting.setShowEmbedded({ ShowEmbedded: $scope.embedded })
            .then(() => {
                authentication.user.ShowEmbedded = $scope.embedded;
                notify({ message: gettextCatalog.getString('Image preferences updated', null), classes: 'notification-success' });
            })
        );
    };

    $scope.openHotkeyModal = () => {
        hotkeyModal.activate({
            params: {
                close() {
                    hotkeyModal.deactivate();
                }
            }
        });
    };

    $scope.saveHotkeys = () => {
        networkActivityTracker.track(
            Setting.setHotkeys({ Hotkeys: $scope.hotkeys })
            .then((result) => {
                if (result.data && result.data.Code === 1000) {
                    authentication.user.Hotkeys = $scope.hotkeys;

                    if ($scope.hotkeys === 1) {
                        hotkeys.bind();
                    } else {
                        hotkeys.unbind();
                    }

                    notify({ message: gettextCatalog.getString('Hotkeys preferences updated', null), classes: 'notification-success' });
                } else if (result.data && result.data.Error) {
                    notify({ message: result.data.Error, classes: 'notification-danger' });
                }
            })
        );
    };

    $scope.deleteAccount = () => {
        deleteAccountModal.activate({
            params: {
                submit(password, feedback) {
                    const params = {
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
                    };
                    const promise = Bug.report(params)
                    .then((data) => {
                        if (data.Code === 1000) {
                            return User.delete({ Password: password })
                            .then((result) => {
                                const { data = {} } = result;
                                if (data.Code === 1000) {
                                    deleteAccountModal.deactivate();
                                    $state.go('login');
                                } else if (data.Error) {
                                    throw data.Error;
                                }
                            });
                        }
                    })
                    .catch((error) => Promise.reject(error));
                    networkActivityTracker.track(promise);
                },
                cancel() {
                    deleteAccountModal.deactivate();
                }
            }
        });
    };
});
