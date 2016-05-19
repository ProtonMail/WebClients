angular.module("proton.controllers.Settings")

.controller('AppearanceController', function(
    $log,
    $rootScope,
    $scope,
    $state,
    $window,
    gettextCatalog,
    $q,
    authentication,
    networkActivityTracker,
    eventManager,
    Setting,
    notify) {
    $scope.appearance = {
        locales: [
            {label: gettextCatalog.getString('English', null), key: 'en_US'}
        ],
        cssTheme: authentication.user.Theme,
        ComposerMode: authentication.user.ComposerMode,
        ViewLayout: authentication.user.ViewLayout,
        MessageButtons: authentication.user.MessageButtons
    };

    $scope.appearance.locale = _.findWhere($scope.appearance.locales, {key: gettextCatalog.getCurrentLanguage()});

    $scope.loadThemeClassic = function() {
        $scope.appearance.cssTheme = "CLASSIC";
        $scope.saveTheme();
    };

    $scope.saveTheme = function(form) {
        var deferred = $q.defer();

        networkActivityTracker.track(
            Setting.theme({Theme: $scope.appearance.cssTheme})
            .then(function(result) {
                if (result.data && result.data.Code === 1000) {
                    notify({message: gettextCatalog.getString('Theme saved', null), classes: 'notification-success'});
                    eventManager.call().then(function() {
                        deferred.resolve();
                    });
                } else if (result.data && result.data.Error) {
                    notify({message: result.data.Error, classes: 'notification-danger'});
                    deferred.reject();
                } else {
                    notify({message: gettextCatalog.getString('Unable to save your changes, please try again.', null, 'Error'), classes: 'notification-danger'});
                    deferred.reject();
                }
            })
        );

        return deferred.promise;
    };

    $scope.clearTheme = function() {
        // Reset the theme value
        $scope.appearance.cssTheme = '';
        // Save the theme
        $scope.saveTheme();
    };

    $scope.saveComposerMode = function(form) {
        var value = parseInt($scope.appearance.ComposerMode);

        networkActivityTracker.track(
            Setting.setComposerMode({ComposerMode: value})
            .then(function(result) {
                if(result.data && result.data.Code === 1000) {
                    notify({message: gettextCatalog.getString('Compose mode saved', null, 'Info'), classes: 'notification-success'});
                    return eventManager.call();
                } else if (result.data && result.data.Error) {
                    notify({message: result.data.Error, classes: 'notification-danger'});
                }
            })
        );
    };

    $scope.saveLayoutMode = function(form) {
        var value = $scope.appearance.ViewLayout;

        networkActivityTracker.track(
            Setting.setViewlayout({ViewLayout: value})
            .then(function(result) {
                if (result.data && result.data.Code === 1000) {
                    notify({message: gettextCatalog.getString('Layout saved', null), classes: 'notification-success'});
                    return eventManager.call();
                } else if (result.data && result.data.Error) {
                    notify({message: result.data.Error, classes: 'notification-danger'});
                }
            })
        );
    };

    $scope.saveDefaultLanguage = function() {
        var lang = $scope.appearance.locale.key;

        Setting.setLanguage({Language: lang})
        .then(function(result) {
            $window.location.reload();
        });
    };

    $scope.saveButtonsPosition = function(form) {
        networkActivityTracker.track(
            Setting.setMessageStyle({ MessageButtons: $scope.appearance.MessageButtons })
            .then(function(result) {
                if (result.data && result.data.Code === 1000) {
                    notify({message: gettextCatalog.getString('Buttons position saved', null, 'Info'), classes: 'notification-success'});
                    return eventManager.call();
                } else if (result.data && result.data.Error) {
                    notify({message: result.data.Error, classes: 'notification-danger'});
                }
            })
        );
    };
});
