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
    $scope.dailyNotifications = !!user.DailyNotifications;
    $scope.signature = user.Signature;
    $scope.aliases = user.addresses;
    $scope.labels = user.labels;

    $scope.initCollapse = function() {
        // $('.collapse').collapse()
    };

    // Drag and Drop configuration
    $scope.dragControlListeners = {
        containment: "#aliases-container",
        accept: function(sourceItemHandleScope, destSortableScope) {
            return sourceItemHandleScope.itemScope.sortableScope.$id === destSortableScope.$id;
        }
    };

    $scope.saveNotification = function(form) {
        networkActivityTracker.track(
            Setting.notificationEmail({
                "NotificationEmail": $scope.notificationEmail,
                "DailyNotifications": !!$scope.dailyNotifications
            }).$promise.then(function(response) {
                notify('Notification email saved');
            }, function(response) {
                $log.error(response);
            })
        );
    };

    $scope.saveLoginPassword = function(form) {
        networkActivityTracker.track(
            Setting.updatePassword({
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
            Setting.keyPassword({
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
            Setting.dislayName({
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
            Setting.signature({
                "Signature": $scope.signature
            }).$promise.then(function(response) {
                notify('Signature saved');
            }, function(response) {
                $log.error(response);
            })
        );
    };

    $scope.saveAliases = function(form) {
        networkActivityTracker.track(
            Setting.aliases({
                "order": $scope.aliases
            }).$promise.then(function(response) {
                notify('Aliases saved');
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
                        label.name = name;
                        label.color = color;
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
                    Label.delete({id: label.LabelID}).$promise.then(function(result) {
                        // TODO remove in labels
                        confirmModal.deactivate();
                        notify('Label deleteded');
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

    $scope.saveTheme = function() {
        // TODO
    };

    $scope.clearTheme = function() {
        // TODO
    };
});
