angular.module("proton.controllers.Settings")

.controller('AccountController', function($log, $rootScope, $scope, $timeout, authentication, networkActivityTracker, notify, Setting, tools) {
    $scope.displayName = authentication.user.DisplayName;
    $scope.notificationEmail = authentication.user.NotificationEmail;
    $scope.dailyNotifications = !!authentication.user.Notify;
    $scope.autosaveContacts = !!authentication.user.AutoSaveContacts;
    $scope.aliases = authentication.user.Addresses;
    $scope.ShowImages = authentication.user.ShowImages;
    $scope.tools = tools;

    $timeout(function() {
        if(angular.isDefined(authentication.user.Signature)) {
            $scope.signature = tools.replaceLineBreaks(authentication.user.Signature);
        }
    }, 1000);

    $scope.saveNotification = function(form) {
        if (angular.isUndefined($scope.noticeePassword)) {
            notify({
                classes: "notification-danger",
                message: "Enter your current login password."
            });
            angular.element('#noticeePassword').focus();
        } else {
            networkActivityTracker.track(
                Setting.noticeEmail({
                    "Password": $scope.noticeePassword,
                    "NotificationEmail": $scope.notificationEmail
                }).$promise
                .then(
                    function(response) {
                        if (response && response.Code === 1000) {
                            $scope.noticeePassword = '';
                            authentication.user.NotificationEmail = $scope.notificationEmail;
                            notify({message: $translate.instant('NOTIFICATION_EMAIL_SAVED'), classes: 'notification-success'});
                        } else if (response.Error) {
                            notify({message: $translate.instant(response.Error), classes: 'notification-danger'});
                        }
                    },
                    function(error) {
                        notify({message: 'Error during the notification request', classes: 'notification-danger'});
                        $log.error(error);
                    }
                )
            );
        }
    };

    $scope.saveDailyNotifications = function(form) {
        networkActivityTracker.track(
          Setting.notify({
              "Notify": +$scope.dailyNotifications
          }).$promise.then(function(response) {
              authentication.user.Notify = +$scope.dailyNotifications;
              notify({message: $translate.instant('PREFERENCE_SAVED'), classes: 'notification-success'});
          }, function(error) {
              notify({message: 'Error during the daily notification request', classes: 'notification-danger'});
              $log.error(error);
          })
        );
    };

    $scope.saveLoginPassword = function(form) {
        networkActivityTracker.track(
            Setting.password({
                OldPassword: $scope.oldLoginPassword,
                OldHashedPassword: pmcw.getHashedPassword($scope.oldLoginPassword),
                NewPassword: $scope.newLoginPassword
            }).$promise.then(function(response) {
                if (response.Error) {
                    notify({message: response.Error, classes: 'notification-danger'});
                } else {
                    notify({message: $translate.instant('LOGIN_PASSWORD_UPDATED'), classes: 'notification-success'});
                    $scope.oldLoginPassword = '';
                    $scope.newLoginPassword = '';
                    $scope.confirmLoginPassword = '';
                    form.$setUntouched();
                }
            }, function(error) {
                notify({message: 'Error during the login password request', classes: 'notification-danger'});
                $log.error(error);
            })
        );
    };

    $scope.saveMailboxPassword = function(form) {
        var oldMailPwd = $scope.oldMailboxPassword;
        var newMailPwd = $scope.newMailboxPassword;
        var newEncPrivateKey = pmcrypto.getNewEncPrivateKey(authentication.user.EncPrivateKey, oldMailPwd, newMailPwd);
        var currentLoginPassword = $scope.currentLoginPassword;

        if (newEncPrivateKey === -1) {
            notify({message: $translate.instant('WRONG_CURRENT_MAILBOX_PASSWORD'), classes: 'notification-danger'});
        } else if ( Error.prototype.isPrototypeOf(newEncPrivateKey) ) {
            // Error messages from OpenPGP.js
            notify({message: newEncPrivateKey.message, classes: 'notification-danger'});
        } else {
            networkActivityTracker.track(
                User.keys({
                    "Password": currentLoginPassword,
                    "PublicKey": authentication.user.PublicKey,
                    "PrivateKey": newEncPrivateKey
                }).$promise.then(function(response) {
                    if(response.Error) {
                        notify({message: response.Error, classes: 'notification-danger'});
                    } else {
                        notify({message: $translate.instant('MAILBOX_PASSWORD_UPDATED'), classes: 'notification-success'});
                        $scope.oldMailboxPassword = '';
                        $scope.newMailboxPassword = '';
                        $scope.confirmMailboxPassword = '';
                        $scope.currentLoginPassword = '';
                        authentication.user.EncPrivateKey = newEncPrivateKey;
                        authentication.savePassword(newMailPwd);
                        form.$setUntouched();
                    }
                }, function(error) {
                    notify({message: 'Error during the mailbox password request', classes: 'notification-danger'});
                    $log.error(error);
                })
            );
        }
    };

    $scope.saveDisplayName = function(form) {
        var displayName = $scope.displayName;

        networkActivityTracker.track(
            Setting.display({
                "DisplayName": displayName
            }).$promise.then(function(response) {
                if(response.Code === 1000) {
                    notify({message: $translate.instant('DISPLAY_NAME_SAVED'), classes: 'notification-success'});
                    authentication.user.DisplayName = displayName;
                    $scope.displayName = displayName;
                } else if(angular.isDefined(response.Error)) {
                    notify({message: response.Error, classes: 'notification-danger'});
                }
            }, function(error) {
                notify({message: 'Error during the display name request', classes: 'notification-danger'});
                $log.error(error);
            })
        );
    };

    $scope.saveSignature = function(form) {
        var signature = $scope.signature;

        signature = signature.replace(/\n/g, "<br />");

        networkActivityTracker.track(
            Setting.signature({
                "Signature": signature
            }).$promise.then(function(response) {
                authentication.user.Signature = signature;
                notify({message: $translate.instant('SIGNATURE_SAVED'), classes: 'notification-success'});
            }, function(error) {
                notify({message: 'Error during the signature request', classes : 'notification-danger'});
                $log.error(error);
            })
        );
    };

    $scope.saveAliases = function(aliasOrder) {
        networkActivityTracker.track(
            Setting.addressOrder({
                "Order": aliasOrder
            }).$promise.then(function(response) {
                notify({message: $translate.instant('ALIASES_SAVED'), classes: 'notification-success'});
            }, function(error) {
                notify({message: 'Error during the aliases request', classes : 'notification-danger'});
                $log.error(error);
            })
        );
    };

    $scope.saveAutosaveContacts = function(form) {
        networkActivityTracker.track(
            Setting.autosave({
                "AutoSaveContacts": +$scope.autosaveContacts
            }).$promise.then(function(response) {
                notify({message: $translate.instant('PREFERENCE_SAVED'), classes: 'notification-success'});
                authentication.user.AutoSaveContacts = +$scope.autosaveContacts;
            }, function(error) {
                notify({message: 'Error during the autosave contacts request', classes : 'notification-danger'});
                $log.error(error);
            })
        );
    };
});
