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
    User,
    user,
    tools,
    pmcw,
    notify,
    networkActivityTracker
) {
    $rootScope.pageName = "settings";
    $scope.tools = tools;
    $scope.displayName = user.DisplayName;
    $scope.notificationEmail = user.NotificationEmail;
    $scope.dailyNotifications = !!user.notify_on;
    $scope.autosaveContacts = !!user.auto_save_contacts;
    $scope.signature = user.Signature;
    $scope.aliases = user.addresses;
    $scope.labels = user.labels;
    $scope.cssTheme = user.user_theme;

    $scope.initCollapse = function() {
        // $('.collapse').collapse()
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
            aliasOrder[i] = d.AddressID;
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
            labelOrder[i] = {order: d.LabelNum};
            $scope.labels[i].LabelNum = i + 1;
          });
          $scope.saveLabelOrder(labelOrder);
        }
    };

    $scope.saveNotification = function(form) {
        networkActivityTracker.track(
            User.notificationEmail({
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
          User.notify({
              "notify": +$scope.dailyNotifications
          }).$promise.then(function(response) {
              user.notify_on = +$scope.dailyNotifications;
              notify('Daily Notification Preference Saved');
          }, function(response) {
              $log.error(response);
          })
        );
    };

    $scope.saveLoginPassword = function(form) {
        networkActivityTracker.track(
            User.updatePassword({
                old_pwd: $scope.oldLoginPassword,
                old_hashed_pwd: pmcw.getHashedPassword($scope.oldLoginPassword),
                new_pwd: $scope.newLoginPassword
            }).$promise.then(function(response) {
                notify('Login password updated');
            }, function(response) {
                $log.error(response);
            })
        );
    };

    $scope.saveMailboxPassword = function(form) {
        networkActivityTracker.track(
            User.keyPassword({
                // TODO (need @feng)
            }).$promise.then(function(response) {
                notify('Mailbox password updated');
            }, function(response) {
                $log.error(response);
            })
        );
    };

    $scope.saveDisplayName = function(form) {
        networkActivityTracker.track(
            User.dislayName({
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
        networkActivityTracker.track(
            User.signature({
                "Signature": $scope.signature
            }).$promise.then(function(response) {
                notify('Signature saved');
            }, function(response) {
                $log.error(response);
            })
        );
    };

    $scope.saveAliases = function(aliasOrder) {
        networkActivityTracker.track(
            User.aliases({
                "order": aliasOrder
            }).$promise.then(function(response) {
                notify('Aliases saved');
            }, function(response) {
                $log.error(response);
            })
        );
    };

    $scope.saveAutosaveContacts = function(form) {
        networkActivityTracker.track(
            User.autosaveContacts({
                "auto_save": +$scope.autosaveContacts
            }).$promise.then(function(response) {
                notify('Autosave Preference saved');
                user.auto_save_contacts = +$scope.autosaveContacts;
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
                    Label.create({
                        name: name,
                        color: color
                    }).$promise.then(function(result) {
                        if(angular.isDefined(result.id)) {
                            // TODO add label to labels
                            labelModal.deactivate();
                            notify('Label created');
                            $state.go($state.current, {}, {reload: true}); // force reload page
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
        labelModal.activate({
            params: {
                title: 'Edit Label',
                label: label,
                create: function(name, color) {
                    Label.edit({
                        label: name,
                        color: color
                    }).$promise.then(function(result) {
                        label.LabelName = name;
                        label.LabelColor = color;
                        labelModal.deactivate();
                        notify('Labed edited');
                    }, function(result) {
                        $log.error(result);
                    });
                },
                cancel: function() {
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
                    Label.delete({LabelID: label.LabelID}).$promise.then(function(result) {
                        confirmModal.deactivate();
                        notify('Label ' + label.LabelName + ' deleteded');
                        $state.go($state.current, {}, {reload: true}); // force reload page
                    }, function(result) {
                        $log.error(result);
                    });
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
                "new_order": labelOrder
            }).$promise.then(function(response) {
                notify('Label order saved');
            }, function(response) {
                $log.error(response);
            })
        );
    };

    $scope.toggleDisplayLabel = function(label) {
        label.Display = (label.Display == 0)?1:0; // toggle display
        Label.edit({
            id: label.LabelID,
            name: label.LabelName,
            color: label.LabelColor,
            display: label.Display
        }).$promise.then(function(result) {
            notify('Label ' + label.LabelName + ' edited');
            $state.go($state.current, {}, {reload: true}); // force reload page
        }, function(result) {
            $log.error(result);
        });
    };

    $scope.saveTheme = function(form) {
      networkActivityTracker.track(
          User.theme({
              "theme": $scope.cssTheme
          }).$promise.then(function(response) {
              notify('Theme saved');
              user.user_theme = $scope.cssTheme;
          }, function(response) {
              $log.error(response);
          })
      );
    };

    $scope.clearTheme = function() {
        // TODO
    };
});
