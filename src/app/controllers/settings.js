angular.module("proton.controllers.Settings", [
    "proton.routes",
    "ui.sortable",
    "proton.modals"
])

.controller("SettingsController", function(
    $log,
    $rootScope,
    $sanitize,
    $scope,
    $state,
    $stateParams,
    $timeout,
    $translate,
    $window,
    Label,
    Logs,
    Setting,
    User,
    authentication,
    confirmModal,
    labelModal,
    networkActivityTracker,
    notify,
    pmcw,
    tools,
    url
) {
    $rootScope.pageName = "Settings";
    $scope.tools = tools;
    $scope.displayName = authentication.user.DisplayName;
    $scope.notificationEmail = authentication.user.NotificationEmail;
    $scope.dailyNotifications = !!authentication.user.Notify;
    $scope.autosaveContacts = !!authentication.user.AutoSaveContacts;
    $scope.aliases = authentication.user.Addresses;
    $scope.labels = authentication.user.Labels;
    $scope.doLogging = authentication.user.LogAuth;
    $scope.cssTheme = authentication.user.Theme;
    $scope.languages = ['English', 'French', 'German', 'Spanish', 'Italian'];
    $scope.locales = {English: 'en_US', French: 'fr_FR', German: 'de_DE', Spanish: 'es_ES', Italian: 'it_IT'};
    $scope.selectedLanguage = 'English';
    $scope.disabledText = $translate.instant('DISABLE');
    $scope.ComposerMode = authentication.user.ComposerMode;
    $scope.MessageButtons = authentication.user.MessageButtons;
    $scope.ShowImages = authentication.user.ShowImages;
    $scope.isSafari = jQuery.browser.name === 'safari';
    $scope.currentLogPage = 1;
    $scope.logItemsPerPage = 20;
    $scope.apiURL = url.get();

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
            d.Order = i;
          });
          $scope.saveLabelOrder(labelOrder);
        }
    };

    if (parseInt($scope.doLogging)===0) {
        $scope.disabledText = $translate.instant('DISABLED');
    }

    $timeout(function() {
        if(angular.isDefined(authentication.user.Signature)) {
            $scope.signature = tools.replaceLineBreaks(authentication.user.Signature);
        }
    }, 1000);

    $scope.$on('updateLabels', $scope.updateLabels);

    $scope.loadLogs = function () {
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
                },
                function(error) {
                    notify({message: 'Error during the initialization of logs', classes: 'notification-danger'});
                    $log.error(error);
                }
            )
        );
    };

    $scope.clearLogs = function() {
        networkActivityTracker.track(
            Logs.clearLogs().then(
                function(response) {
                    $scope.logs = [];
                    $scope.logCount = 0;
                    notify({message: $translate.instant('LOGS_CLEARED'), classes: 'notification-success'});
                },
                function(error) {
                    notify({message: 'Error during the clear logs request', classes: 'notification-danger'});
                    $log.error(error);
                }
            )
        );
    };

    $scope.downloadLogs = function () {
        var logsArray = [['Event', 'Time', 'IP']];
        var csvRows = [];
        var filename = 'logs.csv';

        _.forEach($scope.logs, function(log) {
          logsArray.push([log.Event, moment(log.Time * 1000), log.IP]);
        });

        for(var i=0, l=logsArray.length; i<l; ++i){
            csvRows.push(logsArray[i].join(','));
        }

        var csvString = csvRows.join("%0A");
        var blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });

        saveAs(blob, filename);
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

    $scope.updateLabels = function () {
            $scope.labels = authentication.user.Labels;
    };

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
                                    notify({message: $translate.instant('LABEL_CREATED'), classes: 'notification-success'});
                                    authentication.user.Labels.push(result.Label);
                                } else {
                                    notify({message: result.Error, classes: 'notification-danger'});
                                    $log.error(result);
                                }
                            }, function(error) {
                                notify({message: 'Error during the label creation request', classes: 'notification-danger'});
                                $log.error(error);
                            })
                        );
                    } else {
                        notify({message: $translate.instant('LABEL_NAME_ALREADY_EXISTS'), classes: 'notification-danger'});
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
        var origName = label.Name;
        var origColor = label.Color;

        labelModal.activate({
            params: {
                title: $translate.instant('EDIT_LABEL'),
                label: label,
                create: function(name, color) {
                    labelModal.deactivate();
                    networkActivityTracker.track(
                        Label.update({
                            id: label.ID,
                            Name: name,
                            Color: color,
                            Display: label.Display
                        }).$promise.then(function(result) {
                            if (result.Error) {
                                notify({message: result.Error, classes: 'notification-danger'});
                                label.Name = origName;
                                label.Color = origColor;
                            } else {
                                label.Color = color;
                                label.Name = name;
                                notify({message: $translate.instant('LABEL_EDITED'), classes: 'notification-success'});
                            }
                        }, function(error) {
                            notify({message: 'Error during the label edition request', classes: 'notification-danger'});
                            $log.error(error);
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
                message: 'Are you sure you want to delete this label?', // TODO translate
                confirm: function() {
                    networkActivityTracker.track(
                        Label.delete({id: label.ID}).$promise
                        .then(
                            function(result) {
                                if (result.Code === 1000) {
                                    confirmModal.deactivate();
                                    notify({message: $translate.instant('LABEL_DELETED'), classes: 'notification-success'});
                                    authentication.user.Labels = _.without(authentication.user.Labels, label);
                                    $scope.labels = authentication.user.Labels;
                                    $rootScope.$broadcast('updateLabels');
                                } else if(result.Error) {
                                    notify({message: result.Error, classes: 'notification-danger'});
                                    $log.error(result);
                                }
                            },
                            function(error) {
                                notify({message: 'Error during the label deletion request ', classes: 'notification-danger'});
                                $log.error(error);
                            }
                        )
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
                if (response.Code === 1000) {
                    notify({message: $translate.instant('LABEL_ORDER_SAVED'), classes: 'notification-success'});
                } else if (response.Error) {
                    notify({message: response.Error, classes: 'notification-danger'});
                    $log.error(response);
                }
            }, function(error) {
                notify({message: 'Error during the label edition request ', classes: 'notification-danger'});
                $log.error(error);
            })
        );
    };

    $scope.toggleDisplayLabel = function(label) {
        Label.update({
            id: label.ID,
            Name: label.Name,
            Color: label.Color,
            Display: label.Display
        }).$promise.then(function(result) {
            if (result.Code === 1000) {
                notify({message: $translate.instant('LABEL_EDITED'), classes: 'notification-success'});
            } else if (result.Error) {
                notify({message: result.Error, classes: 'notification-danger'});
            }
        }, function(error) {
            notify({message: 'Error during the label edition request ', classes: 'notification-danger'});
            $log.error(error);
        });
    };

    $scope.saveMessageButtons = function(form) {
        networkActivityTracker.track(
            Setting.setMessageStyle({
                "MessageButtons": parseInt($scope.MessageButtons)
            }).$promise.then(
                function(response) {
                    if(response.Code === 1000) {
                        notify({message: $translate.instant('THEME_SAVED'), classes: 'notification-success'});
                        authentication.user.MessageButtons = $scope.MessageButtons;
                    } else if (response.Error) {
                        notify({message: response.Error, classes: 'notification-danger'});
                    }
                },
                function(error) {
                    notify({message: 'Error during the appearance edition request', classes: 'notification-danger'});
                    $log.error(error);
                }
            )
        );
    };

    $scope.saveComposerMode = function(form) {
        var value = parseInt($scope.ComposerMode);

        networkActivityTracker.track(
            Setting.setComposerMode({
                "ComposerMode": value
            }).$promise.then(
                function(response) {
                    if(response.Code === 1000) {
                        authentication.user.ComposerMode = value;
                        notify({message: $translate.instant('MODE_SAVED'), classes: 'notification-success'});
                    } else if (response.Error) {
                        notify({message: response.Error, classes: 'notification-danger'});
                    }
                },
                function(error) {
                    notify({message: 'Error during the composer preference request', classes: 'notification-danger'});
                    $log.error(error);
                }
            )
        );
    };

    $scope.saveShowImages = function(form) {
        networkActivityTracker.track(
            Setting.setShowImages({
                "ShowImages": parseInt($scope.ShowImages)
            }).$promise.then(
                function(response) {
                    if(response.Code === 1000) {
                        authentication.user.ShowImages = $scope.ShowImages;
                        notify({message: $translate.instant('THEME_SAVED'), classes: 'notification-success'});
                    } else if (response.Error) {
                        notify({message: response.Error, classes: 'notification-danger'});
                    }
                },
                function(error) {
                    notify({message: 'Error during the email preference request', classes: 'notification-danger'});
                    $log.error(error);
                }
            )
        );
    };

    $scope.saveTheme = function(form) {
        networkActivityTracker.track(
            Setting.theme({
                "Theme": $scope.cssTheme
            }).$promise
            .then(
                function(response) {
                    if(response.Code === 1000) {
                        authentication.user.Theme = $scope.cssTheme;
                        notify({message: $translate.instant('THEME_SAVED'), classes: 'notification-success'});
                    } else if (response.Error) {
                        notify({message: response.Error, classes: 'notification-danger'});
                    }
                },
                function(error) {
                    notify({message: 'Error during the theme edition request', classes: 'notification-danger'});
                    $log.error(error);
                }
            )
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
        if(value === 0) {
            confirmModal.activate({
                params: {
                    message: 'This will delete all access logs, do you want to continue?', // TODO translate
                    confirm: function() {
                        Setting.setLogging({LogAuth: 0});
                        $scope.doLogging = 0;
                        authentication.user.LogAuth = 0;
                        notify({message: 'Logging Preference Updated', classes: 'notification-success'});
                        confirmModal.deactivate();
                        $scope.disabledText = $translate.instant('DISABLED');
                    },
                    cancel: function() {
                        confirmModal.deactivate();
                    }
                }
            });
        } else {
            $scope.doLogging = value;
            authentication.user.LogAuth = value;
            Setting.setLogging({LogAuth: value});
            notify({message: 'Logging Preference Updated', classes: 'notification-success'});
            $scope.disabledText = $translate.instant('DISABLE');
        }
    };

    $scope.clearTheme = function() {
        $scope.cssTheme = '';
        $scope.saveTheme();
    };

    // This is used for general debugging for any purpose. feel free to change:
    $scope.apiTest = function() {
        Setting.apiTest().$promise
        .then(
            function(response) {
                $log.debug(response);
            },
            function(response) {
                $log.error(response);
            }
        );
    };
});
