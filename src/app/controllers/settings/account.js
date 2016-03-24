angular.module('proton.controllers.Settings')

.controller('AccountController', function(
    $log,
    $rootScope,
    $scope,
    $timeout,
    $translate,
    $q,
    authentication,
    Bug,
    confirmModal,
    deleteAccountModal,
    Key,
    networkActivityTracker,
    notify,
    pmcw,
    Setting,
    Organization,
    tools,
    User
) {
    $scope.displayName = authentication.user.DisplayName;
    $scope.notificationEmail = authentication.user.NotificationEmail;
    $scope.dailyNotifications = !!authentication.user.Notify;
    $scope.autosaveContacts = !!authentication.user.AutoSaveContacts;
    $scope.ShowImages = authentication.user.ShowImages;
    $scope.tools = tools;

    $timeout(function() {
        if(angular.isDefined(authentication.user.Signature)) {
            $scope.signature = tools.replaceLineBreaks(authentication.user.Signature);
        }
    }, 1000);

    $scope.saveNotification = function(form) {
        if (angular.isUndefined($scope.noticeePassword)) {
            notify({classes: "notification-danger", message: "Enter your current login password."});
            angular.element('#noticeePassword').focus();
        } else {
            networkActivityTracker.track(
                Setting.noticeEmail({Password: $scope.noticeePassword, NotificationEmail: $scope.notificationEmail})
                .then(function(result) {
                    if (result.data && result.data.Code === 1000) {
                        $scope.noticeePassword = '';
                        authentication.user.NotificationEmail = $scope.notificationEmail;
                        notify({message: $translate.instant('NOTIFICATION_EMAIL_SAVED'), classes: 'notification-success'});
                    } else if (result.data && result.data.Error) {
                        notify({message: result.data.Error, classes: 'notification-danger'});
                    }
                })
            );
        }
    };

    $scope.saveDailyNotifications = function(form) {
        var value = $scope.dailyNotifications;

        networkActivityTracker.track(
          Setting.notify({Notify: $scope.dailyNotifications})
          .then(function(result) {
              if (result.data && result.data.Code === 1000) {
                  authentication.user.Notify = $scope.dailyNotifications;
                  notify({message: $translate.instant('PREFERENCE_SAVED'), classes: 'notification-success'});
              } else if (result.data && result.data.Error) {
                  notify({message: result.data.Error, classes: 'notification-danger'});
              }
          })
        );
    };

    $scope.saveLoginPassword = function(form) {
        var oldLoginPwd = $scope.oldLoginPassword;
        var newLoginPwd = $scope.newLoginPassword;
        var confLoginPwd = $scope.confirmLoginPassword;

        if (newLoginPwd !== confLoginPwd) {
            notify({message: 'Confirm login password is wrong', classes: 'notification-danger'});
            return false;
        }

        networkActivityTracker.track(
            Setting.password({
                Password: oldLoginPwd,
                OldHashedPassword: pmcw.getHashedPassword(oldLoginPwd),
                NewPassword: newLoginPwd
            }).then(function(result) {
                if (result.data && result.data.Code === 1000) {
                    notify({message: $translate.instant('LOGIN_PASSWORD_UPDATED'), classes: 'notification-success'});
                    $scope.oldLoginPassword = '';
                    $scope.newLoginPassword = '';
                    $scope.confirmLoginPassword = '';
                    form.$setUntouched();
                } else if(result.data && result.data.Error) {
                    notify({message: result.data.Error, classes: 'notification-danger'});
                } else {
                    notify({message: 'Login password invalid', classes: 'notification-danger'});
                }
            }, function(error) {
                notify({message: 'Error during the login password request', classes: 'notification-danger'});
                $log.error(error);
            })
        );
    };

    $scope.saveMailboxPassword = function(form) {
        var loginPwd = $scope.currentLoginPassword;
        var oldMailPwd = $scope.oldMailboxPassword;
        var newMailPwd = $scope.newMailboxPassword;
        var confMailPwd = $scope.confirmMailboxPassword;
        var copyAddresses = angular.copy(authentication.user.Addresses);
        var promises = [];

        if (oldMailPwd !== authentication.getPassword()) {
            notify({message: 'Current mailbox password is wrong', classes: 'notification-danger'});
            return false;
        }

        if (newMailPwd !== confMailPwd) {
            notify({message: 'Confirm mailbox password is wrong', classes: 'notification-danger'});
            return false;
        }

        // If the current user is an admin, we need to change the organization private key
        if (authentication.user.Role === 2) {
            // Get organization key
            Organization.getKey().then(function(result) {
                if (result.data && result.data.Code === 1000) {
                    var encryptPrivateKey = result.data.PrivateKey;

                    // Decrypt organization private key with the old mailbox password (current)
                    pmcw.decryptPrivateKey(encryptPrivateKey, oldMailPwd).then(function(package) {
                        // Encrypt private key with the new mailbox password
                        pmcw.encryptPrivateKey(package, newMailPwd).then(function(privateKey) {
                            // Send request to the back-end to update the organization private key
                            Organization.private({
                                Password: loginPwd,
                                PrivateKey: privateKey
                            }).then(function(result) {
                                if (result.data && result.data.Code === 1000) {
                                    // No message
                                } else if (result.data && result.data.Error) {
                                    notify({message: result.data.Error, classes: 'notification-danger'});
                                } else {
                                    notify({message: 'Error during the organization update key request', classes: 'notification-danger'});
                                }
                            });
                        }, function(error) {
                            notify({message: error, classes: 'notification-danger'});
                        });
                    }, function(error) {
                        // TODO We don't display the error for 3.1, but it should be enable after
                        // https://github.com/ProtonMail/Angular/issues/2434
                        // notify({message: 'Unable to decrypt and update organization key', classes: 'notification-danger'});
                    });
                } else if (result.data && result.data.Error) {
                    notify({message: result.data.Error, classes: 'notification-danger'});
                } else {
                    notify({message: 'Error during the organization get key request', classes: 'notification-danger'});
                }
            }, function(error) {
                notify({message: 'Error during the organization get key request', classes: 'notification-danger'});
            });
        }

        // Instead of grab keys from the cache, we call the back-end, just to make sure everything is up to date
        networkActivityTracker.track(User.get().then(function(result) {
            if (result.data.Code === 1000) {
                _.each(result.data.User.Addresses, function(address) {
                    _.each(address.Keys, function(key) {
                        // Decrypt private key with the old mailbox password
                        promises.push(pmcw.decryptPrivateKey(key.PrivateKey, oldMailPwd).then(function(package) {
                            // Encrypt the key with the new mailbox password
                            return pmcw.encryptPrivateKey(package, newMailPwd).then(function(privateKey) {
                                return {ID: key.ID, PrivateKey: privateKey};
                            }, function(error) {
                                $log.error(error);
                                return Promise.reject(error);
                            });
                        }, function(error) {
                            $log.error(error);
                            return Promise.resolve(0);
                        }));
                    });
                });

                // When all promises are done, we can send the new keys to the back-end
                return $q.all(promises).then(function(keys) {

                    keys = keys.filter(function(obj) { return obj !== 0; });

                    if (keys.length === 0) {
                        notify({message: 'No keys to update', classes: 'notification-danger'});
                    }

                    return Key.private({
                        Password: loginPwd,
                        Keys: keys
                    }).then(function(result) {
                        if (result.data && result.data.Code === 1000) {
                            $scope.currentLoginPassword = '';
                            $scope.oldMailboxPassword = '';
                            $scope.newMailboxPassword = '';
                            $scope.confirmMailboxPassword = '';
                            form.$setUntouched();
                            authentication.savePassword(newMailPwd);
                            notify({message: $translate.instant('MAILBOX_PASSWORD_UPDATED'), classes: 'notification-success'});
                        } else if(result.data && result.data.Error) {
                            notify({message: result.data.Error, classes: 'notification-danger'});
                        } else {
                            notify({message: 'Mailbox password invalid', classes: 'notification-danger'});
                        }
                    });
                }, function(error) {
                    $log.error(error);
                    notify({message: error, classes: 'notification-danger'});
                });
            } else if (result.Error) {
                $log.error(result.Error);
                notify({message: result.Error, classes: 'notification-danger'});
            } else {
                notify({message: 'Error during the user get request', classes: 'notification-danger'});
            }
        }, function(errors) {
            _.each(errors, function(error) {
                notify({message: error, classes: 'notification-danger'});
            });
        }));
    };

    $scope.saveIdentity = function() {
        var displayName = $scope.displayName;
        var signature = $scope.signature;

        signature = signature.replace(/\n/g, '<br />');

        networkActivityTracker.track(
            $q.all({
                displayName: Setting.display({DisplayName: displayName}),
                signature: Setting.signature({Signature: signature})
            })
            .then(function(result) {
                if (result.data.displayName.Code === 1000 && result.data.signature.Code === 1000) {
                    authentication.user.DisplayName = displayName;
                    authentication.user.Signature = signature;
                    notify({message: $translate.instant('IDENTITY_SAVED'), classes: 'notification-success'});
                } else {
                    notify({message: 'Error during the request', classes: 'notification-danger'});
                }
            }, function() {
                notify({message: 'Error during the request', classes: 'notification-danger'});
            })
        );
    };

    $scope.saveAutosaveContacts = function(form) {
        networkActivityTracker.track(
            Setting.autosave({AutoSaveContacts: $scope.autosaveContacts})
            .then(function(result) {
                notify({message: $translate.instant('PREFERENCE_SAVED'), classes: 'notification-success'});
                authentication.user.AutoSaveContacts = $scope.autosaveContacts;
            })
        );
    };

    $scope.saveShowImages = function(form) {
        networkActivityTracker.track(
            Setting.setShowImages({ShowImages: $scope.ShowImages})
            .then(function(result) {
                authentication.user.ShowImages = $scope.ShowImages;
                notify({message: $translate.instant('IMAGE_PREFERENCES_UPDATED'), classes: 'notification-success'});
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
