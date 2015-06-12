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
    authentication,
    confirmModal,
    labelModal,
    Label,
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
    $scope.cssTheme = user.Theme;
    $scope.languages = ['English', 'French', 'German', 'Spanish', 'Italian'];
    $scope.locales = {English: 'en_US', French: 'fr_FR', German: 'de_DE', Spanish: 'es_ES', Italian: 'it_IT'};
    $scope.selectedLanguage = 'English';


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
                notify('Notification email saved');
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
              notify('Daily Notification Preference Saved');
          }, function(response) {
              $log.error(response);
          })
        );
    };

    $scope.saveDefaultLanguage = function(form) {
        notify('Language preference saved - ' + $scope.defaultLanguage);
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
                    notify('Login password updated');
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
            notify('Wrong Current Mailbox Password');
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
                    notify('Mailbox password updated');
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
                notify('Display name saved');
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
                notify('Signature saved');
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
                notify('Aliases saved');
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
                notify('Autosave Preference saved');
                user.AutoSaveContacts = +$scope.autosaveContacts;
            }, function(response) {
                $log.error(response);
            })
        );
    };

    $scope.createLabel = function() {
        labelModal.activate({
            params: {
                title: 'Create New Label',
                create: function(name, color) {
                    Label.save({
                        Name: name,
                        Color: color,
                        Display: 0
                    }).$promise.then(function(result) {
                        if(angular.isDefined(result.Label)) {
                            // TODO add label to labels
                            labelModal.deactivate();
                            notify('Label created');
                            $scope.labels.push(result.Label);
                        } else {
                            notify(result.error);
                            $log.error(result);
                        }
                    }, function(result) {
                        notify(result.error);
                        $log.error(result);
                    });
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
                title: 'Edit Label',
                label: label,
                create: function() {
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
                                notify('Labed edited');
                            }
                            labelModal.deactivate();

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
                title: 'Delete Label',
                message: 'Are you sure you want to delete this label?',
                confirm: function() {
                    networkActivityTracker.track(
                        Label.delete({id: label.ID}).$promise.then(function(result) {
                            confirmModal.deactivate();
                            notify('Label ' + label.Name + ' deleted');
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
                notify('Label order saved');
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
            notify('Label ' + label.Name + ' edited');
        }, function(result) {
            $log.error(result);
        });
    };

    $scope.saveTheme = function(form) {
      networkActivityTracker.track(
          Setting.theme({
              "Theme": $scope.cssTheme
          }).$promise.then(function(response) {
              notify('Theme saved');
              user.Theme = $scope.cssTheme;
          }, function(response) {
              $log.error(response);
          })
      );
    };

    $scope.saveDefaultLanguage = function() {
        var lang = $scope.locales[$scope.selectedLanguage];
        $translate.use(lang);
        notify('Default Language Changed');

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

    $scope.clearTheme = function() {
        // TODO
    };
});
