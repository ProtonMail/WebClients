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
    labelModal,
    Setting,
    user,
    tools,
    pmcrypto,
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
                old_hashed_pwd: pmcrypto.getHashedPassword($scope.oldLoginPassword),
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
                create: function(files) {
                    labelModal.deactivate();
                    notify('Label created');
                },
                cancel: function() {
                    labelModal.deactivate();
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
