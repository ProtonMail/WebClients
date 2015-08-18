angular.module("proton.controllers.Settings", [
    "proton.routes",
    "ui.sortable",
    "proton.modals"
])

.controller("SettingsController", function(
    $log,
    $rootScope,
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
    $rootScope.pageName = "settings";
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

    if (parseInt($scope.doLogging)===0) {
        $scope.disabledText = $translate.instant('DISABLED');
    }

    $timeout(function() {
        if(angular.isDefined(authentication.user.Signature)) {
            $scope.signature = tools.replaceLineBreaks(authentication.user.Signature);
        }
    }, 1000);

    $scope.currentLogPage = 1;
    $scope.logItemsPerPage = 20;

    $scope.apiURL = url.get();

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

    $scope.exportPublicKey = function () {
        var pbk = authentication.user.PublicKey;
        var blob = new Blob([pbk], { type: 'data:text/plain;charset=utf-8;' });
        var filename = 'protonmail_public_' + authentication.user.Name + '.txt';

        saveAs(blob, filename);
    };

    // NOT USED
    $scope.exportEncPrivateKey = function () {
        var pbk = authentication.user.EncPrivateKey;
        var blob = new Blob([pbk], { type: 'data:text/plain;charset=utf-8;' });
        var filename = 'protonmail_private_'+authentication.user.Name+'.txt';

        saveAs(blob, filename);
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
            d.Order = i;
          });
          $scope.saveLabelOrder(labelOrder);
        }
    };

    $scope.$on('updateLabels', function(){$scope.updateLabels();});
    $scope.updateLabels = function () {
            $scope.labels = authentication.user.Labels;
    };

    $scope.saveNotification = function(form) {
        // $log.debug($scope.noticeePassword);
        if ($scope.noticeePassword===undefined) {
            notify({
                classes: "notificaton-danger",
                message: "Enter your current login password."
            });
            angular.element('#noticeePassword').focus();
            return;
        }

        networkActivityTracker.track(
            Setting.noticeEmail({
                "Password": $scope.noticeePassword,
                "NotificationEmail": $scope.notificationEmail
            }).$promise
            .then(
                function(response) {
                    if (response && response.Code===1000) {
                        $scope.noticeePassword = '';
                        authentication.user.NotificationEmail = $scope.notificationEmail;
                        notify($translate.instant('NOTIFICATION_EMAIL_SAVED'));
                    }
                    else {
                        if (response.Error) {
                            notify($translate.instant(response.Error));
                        }
                    }
                },
                function(response) {
                    $log.error(response);
                }
            )
        );
    };

    $scope.saveDailyNotifications = function(form) {
        networkActivityTracker.track(
          Setting.notify({
              "Notify": +$scope.dailyNotifications
          }).$promise.then(function(response) {
              authentication.user.Notify = +$scope.dailyNotifications;
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

        var newEncPrivateKey = pmcrypto.getNewEncPrivateKey(authentication.user.EncPrivateKey, oldMailPwd, newMailPwd);
        var currentLoginPassword = $scope.currentLoginPassword;

        if (newEncPrivateKey === -1) {
            notify($translate.instant('WRONG_CURRENT_MAILBOX_PASSWORD'));
        }
        else if ( Error.prototype.isPrototypeOf(newEncPrivateKey) ) {
            // Error messages from OpenPGP.js
            notify(newEncPrivateKey.message);
        }
        else {
            networkActivityTracker.track(
                User.keys({
                    "Password": currentLoginPassword,
                    "PublicKey": authentication.user.PublicKey,
                    "PrivateKey": newEncPrivateKey
                }).$promise.then(function(response) {
                    if(response.Error) {
                        notify(response.Error);
                    } else {
                        notify($translate.instant('MAILBOX_PASSWORD_UPDATED'));
                        $scope.oldMailboxPassword = '';
                        $scope.newMailboxPassword = '';
                        $scope.confirmMailboxPassword = '';
                        $scope.currentLoginPassword = '';
                        authentication.user.EncPrivateKey = newEncPrivateKey;
                        authentication.savePassword(newMailPwd);
                        form.$setUntouched();
                    }
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
                authentication.user.DisplayName = $scope.displayName;
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
                authentication.user.Signature = signature;
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
                authentication.user.AutoSaveContacts = +$scope.autosaveContacts;
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
                                    notify(result.Error);
                                    $log.error(result);
                                }
                            }, function(result) {
                                notify(result.Error);
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
                                notify(result.Error);
                                label.Name = origName;
                                label.Color = origColor;
                            }
                            else {
                                label.Color = color;
                                label.Name = name;
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
                        Label.delete({id: label.ID}).$promise
                        .then(
                            function(result) {
                                confirmModal.deactivate();
                                if (result.Code === 1000) {
                                    notify($translate.instant('LABEL_DELETED'));
                                    authentication.user.Labels = _.without(authentication.user.Labels, label);
                                    $scope.labels = authentication.user.Labels;
                                    $rootScope.$broadcast('updateLabels');
                                }
                            },
                            function(result) {
                                $log.error(result);
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

    $scope.saveMessageButtons = function(form) {
        networkActivityTracker.track(
            Setting.setMessageStyle({
                "MessageButtons": parseInt($scope.MessageButtons)
            }).$promise.then(
                function(response) {
                    notify($translate.instant('THEME_SAVED'));
                    authentication.user.MessageButtons = $scope.MessageButtons;
                },
                function(response) {
                    $log.error(response);
                }
            )
        );
    };

    $scope.saveComposerMode = function(form) {
        networkActivityTracker.track(
            Setting.setComposerMode({
                "ComposerMode": parseInt($scope.ComposerMode)
            }).$promise.then(
                function(response) {
                    notify($translate.instant('THEME_SAVED'));
                    authentication.user.ComposerMode = $scope.ComposerMode;
                    $scope.apply();
                },
                function(response) {
                    $log.error(response);
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
                    notify($translate.instant('THEME_SAVED'));
                    authentication.user.ShowImages = $scope.ShowImages;
                    $scope.apply();
                },
                function(response) {
                    $log.error(response);
                }
            )
        );
    };

    $scope.saveTheme = function(form) {
        $log.debug('saveTheme');
        networkActivityTracker.track(
            Setting.theme({
                "Theme": btoa($scope.cssTheme)
            }).$promise
            .then(
                function(response) {
                    notify($translate.instant('THEME_SAVED'));
                    authentication.user.Theme = $scope.cssTheme;
                },
                function(response) {
                    $log.error(response);
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
                    message: 'This will delete all access logs, do you want to continue?',
                    confirm: function() {
                        Setting.setLogging({LogAuth: 0});
                        $scope.doLogging = 0;
                        authentication.user.LogAuth = 0;
                        notify('Logging Preference Updated');
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
            notify('Logging Preference Updated');
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
