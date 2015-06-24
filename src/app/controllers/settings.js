angular.module("proton.controllers.Settings", [
    "proton.routes",
    "ui.sortable",
    "proton.modals"
])

.controller("SettingsController", function(
    $state,
    $stateParams,
    $scope,
    $rootScope,
    $log,
    $window,
    authentication,
    confirmModal,
    labelModal,
    Label,
    Logs,
    Setting,
    User,
    user,
    tools,
    pmcw,
    notify,
    networkActivityTracker,
    $translate
) {
    $rootScope.pageName = "settings";
    $scope.tools = tools;
    $scope.displayName = user.DisplayName;
    $scope.notificationEmail = user.NotificationEmail;
    $scope.dailyNotifications = !!user.Notify;
    $scope.autosaveContacts = !!user.AutoSaveContacts;
    $scope.signature = user.Signature;
    $scope.aliases = user.Addresses;
    $scope.labels = user.Labels;
    $scope.doLogging = user.LogAuth;
    $scope.cssTheme = user.Theme;
    $scope.languages = ['English', 'French', 'German', 'Spanish', 'Italian'];
    $scope.locales = {English: 'en_US', French: 'fr_FR', German: 'de_DE', Spanish: 'es_ES', Italian: 'it_IT'};
    $scope.selectedLanguage = 'English';

    $scope.currentLogPage = 1;
    $scope.logItemsPerPage = 20;

    $scope.apiURL = authentication.baseURL;

    $scope.loadLogs = function (page) {
        $scope.currentLogPage = page;
        // ajax call here get new logs

    };

    $scope.paginate = function(value) {
        var begin, end, index;
        begin = ($scope.currentLogPage - 1) * $scope.logItemsPerPage;
        end = begin + $scope.logItemsPerPage;
        index = $scope.logs.indexOf(value);
        return (begin <= index && index < end);
    };

    $scope.initLogs = function() {
        networkActivityTracker.track(
            Logs.getLogs().then(
                function(response) {
                    $scope.logs = response.data.Logs;
                    $scope.logCount = $scope.logs.length;
                    $scope.currentLogPage = 1;
                }
            )
        );
    };

    $scope.loadLogs = function() {

    };

    $scope.clearLogs = function() {
        networkActivityTracker.track(
            Logs.clearLogs().then(
                function(response) {
                    $scope.logs = [];
                    $scope.logCount = 0;
                    notify($translate.instant('LOGS_CLEARED'));
                }
            )
        );
    };

    // Drag and Drop configuration
    $scope.aliasDragControlListeners = {
        containment: "#aliases-container",
        accept: function(sourceItemHandleScope, destSortableScope) {
            return sourceItemHandleScope.itemScope.sortableScope.$id === destSortableScope.$id;
        },
        orderChanged: function() {
          aliasOrder = [];
          _.forEach($scope.aliases, function(d,i) {
            aliasOrder[i] = d.Send;
          });
          $scope.saveAliases(aliasOrder);
        }
    };

    $scope.labelsDragControlListeners = {
        containment: "#labelContainer",
        accept: function(sourceItemHandleScope, destSortableScope) {
            return sourceItemHandleScope.itemScope.sortableScope.$id === destSortableScope.$id;
        },
        orderChanged: function() {
          labelOrder = [];
          _.forEach($scope.labels, function(d,i) {
            labelOrder[i] = d.Order;
          });
          $scope.saveLabelOrder(labelOrder);
        }
    };

    $scope.saveNotification = function(form) {
        networkActivityTracker.track(
            Setting.noticeEmail({
                "NotificationEmail": $scope.notificationEmail
            }).$promise.then(function(response) {
                user.NotificationEmail = $scope.notificationEmail;
                notify($translate.instant('NOTIFICATION_EMAIL_SAVED'));
            }, function(response) {
                $log.error(response);
            })
        );
    };

    $scope.saveDailyNotifications = function(form) {
        networkActivityTracker.track(
          Setting.notify({
              "Notify": +$scope.dailyNotifications
          }).$promise.then(function(response) {
              user.Notify = +$scope.dailyNotifications;
              notify($translate.instant('PREFERENCE_SAVED'));
          }, function(response) {
              $log.error(response);
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
                    notify(response.Error);
                }
                else {
                    notify($translate.instant('LOGIN_PASSWORD_UPDATED'));
                    $scope.oldLoginPassword = '';
                    $scope.newLoginPassword = '';
                    $scope.confirmLoginPassword = '';
                    form.$setUntouched();
                }
            }, function(response) {
                $log.error(response);
            })
        );
    };

    $scope.saveMailboxPassword = function(form) {
        var oldMailPwd = $scope.oldMailboxPassword;
        var newMailPwd = $scope.newMailboxPassword;

        var newEncPrivateKey = pmcrypto.getNewEncPrivateKey(user.EncPrivateKey, oldMailPwd, newMailPwd);

        if (newEncPrivateKey === -1) {
            notify($translate.instant('WRONG_CURRENT_MAILBOX_PASSWORD'));
        }
        else if (newEncPrivateKey.length <50) {
            notify(newEncPrivateKey);
        }
        else {
            networkActivityTracker.track(
                User.keys({
                    "PublicKey" : user.PublicKey,
                    "PrivateKey": newEncPrivateKey
                }).$promise.then(function(response) {
                    notify($translate.instant('MAILBOX_PASSWORD_UPDATED'));
                    $scope.oldMailboxPassword = '';
                    $scope.newMailboxPassword = '';
                    $scope.confirmMailboxPassword = '';
                    form.$setUntouched();
                }, function(response) {
                    $log.error(response);
                })
            );
        }
    };

    $scope.saveDisplayName = function(form) {
        networkActivityTracker.track(
            Setting.display({
                "DisplayName": $scope.displayName
            }).$promise.then(function(response) {
                notify($translate.instant('DISPLAY_NAME_SAVED'));
                $scope.user.DisplayName = $scope.displayName;
            }, function(response) {
                $log.error(response);
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
                $scope.user.Signature = signature;
                notify($translate.instant('SIGNATURE_SAVED'));
            }, function(response) {
                $log.error(response);
            })
        );
    };

    $scope.saveAliases = function(aliasOrder) {
        networkActivityTracker.track(
            Setting.addressOrder({
                "Order": aliasOrder
            }).$promise.then(function(response) {
                notify($translate.instant('ALIASES_SAVED'));
            }, function(response) {
                $log.error(response);
            })
        );
    };

    $scope.saveAutosaveContacts = function(form) {
        networkActivityTracker.track(
            Setting.autosave({
                "AutoSaveContacts": +$scope.autosaveContacts
            }).$promise.then(function(response) {
                notify($translate.instant('PREFERENCE_SAVED'));
                user.AutoSaveContacts = +$scope.autosaveContacts;
            }, function(response) {
                $log.error(response);
            })
        );
    };

    $scope.createLabel = function() {
        labelModal.activate({
            params: {
                title: $translate.instant('CREATE_NEW_LABEL'),
                create: function(name, color) {
                    if (_.find($scope.labels, function(l) {return l.Name === name;}) === undefined) {
                        labelModal.deactivate();
                        networkActivityTracker.track(
                            Label.save({
                                Name: name,
                                Color: color,
                                Display: 0
                            }).$promise.then(function(result) {
                                if(angular.isDefined(result.Label)) {
                                    notify($translate.instant('LABEL_CREATED'));
                                    $scope.labels.push(result.Label);
                                } else {
                                    notify(result.error);
                                    $log.error(result);
                                }
                            }, function(result) {
                                notify(result.error);
                                $log.error(result);
                            })
                        );
                    }
                    else {
                        notify($translate.instant('LABEL_NAME_ALREADY_EXISTS'));
                        labelModal.deactivate();
                    }
                },
                cancel: function() {
                    labelModal.deactivate();
                }
            }
        });
    };

    $scope.editLabel = function(label) {
        origName = label.Name;
        origColor = label.Color;
        labelModal.activate({
            params: {
                title: $translate.instant('EDIT_LABEL'),
                label: label,
                create: function() {
                    labelModal.deactivate();
                    networkActivityTracker.track(
                        Label.update({
                            id: label.ID,
                            Name: label.Name,
                            Color: label.Color,
                            Display: label.Display
                        }).$promise.then(function(result) {
                            if (result.Error) {
                                notify(result.Error);
                                label.Name = origName;
                                label.Color = origColor;
                            }
                            else {
                                notify($translate.instant('LABEL_EDITED'));
                            }

                        }, function(result) {
                            $log.error(result);
                        })
                    );
                },
                cancel: function() {
                    label.Name = origName;
                    label.Color = origColor;
                    labelModal.deactivate();
                }
            }
        });
    };

    $scope.deleteLabel = function(label) {
        confirmModal.activate({
            params: {
                title: $translate.instant('DELETE_LABEL'),
                message: 'Are you sure you want to delete this label?',
                confirm: function() {
                    networkActivityTracker.track(
                        Label.delete({id: label.ID}).$promise.then(function(result) {
                            confirmModal.deactivate();
                            notify($translate.instant('LABEL_DELETED'));
                            label.Display = 1;
                            $scope.labels = _.filter($scope.labels, function (d) { return d.ID !== label.ID; });
                        }, function(result) {
                            $log.error(result);
                        })
                    );
                },
                cancel: function() {
                    confirmModal.deactivate();
                }
            }
        });
    };

    $scope.saveLabelOrder = function(labelOrder) {
        networkActivityTracker.track(
            Label.order({
                "Order": labelOrder
            }).$promise.then(function(response) {
                notify($translate.instant('LABEL_ORDER_SAVED'));
            }, function(response) {
                $log.error(response);
            })
        );
    };

    $scope.toggleDisplayLabel = function(label) {
        label.Display = (label.Display === 0)?1:0; // toggle display
        Label.update({
            id: label.ID,
            Name: label.Name,
            Color: label.Color,
            Display: label.Display
        }).$promise.then(function(result) {
            notify($translate.instant('LABEL_EDITED'));
        }, function(result) {
            $log.error(result);
        });
    };

    $scope.saveTheme = function(form) {
      networkActivityTracker.track(
          Setting.theme({
              "Theme": $scope.cssTheme
          }).$promise.then(function(response) {
              notify($translate.instant('THEME_SAVED'));
              user.Theme = $scope.cssTheme;
          }, function(response) {
              $log.error(response);
          })
      );
    };

    $scope.saveDefaultLanguage = function() {
        var lang = $scope.locales[$scope.selectedLanguage];

        // Forcing a specific page to use HTTPS with angularjs
        // $window.location.href = $location.absUrl().replace('http', 'https'); // TODO try it on prod

        $translate.use(lang).then(function(result) {
            notify($translate.instant('DEFAULT_LANGUAGE_CHANGED'));
        });

        // TODO uncomment when route for change language is working
        // networkActivityTracker.track(
        //     Setting.setLanguage({
        //         "Language": lang
        //     }).$promise.then(function(response) {
        //         notify('Default Language Changed');
        //         console.log(response);
        //         $translate.use(lang);
        //     }, function(response) {
        //         $log.error(response);
        //     })
        // );
    };

    $scope.setLogging = function(value) {
        console.log('...',value);
        if(value === 0) {
            confirmModal.activate({
                params: {
                    message: 'This will delete all access logs, do you want to continue?',
                    confirm: function() {
                        Setting.setLogging({LogAuth: 0});
                        $scope.doLogging = 0;
                        user.LogAuth = 0;
                        notify('Logging Preference Updated');
                        confirmModal.deactivate();
                    },
                    cancel: function() {
                        confirmModal.deactivate();
                    }
                }
            });
        } else {
            $scope.doLogging = value;
            user.LogAuth = value;
            Setting.setLogging({LogAuth: value});
            notify('Logging Preference Updated');
        }
    };

    $scope.clearTheme = function() {
        // TODO
    };
});
