angular.module("proton.controllers.Settings")

.controller('AppearanceController', function($log, $rootScope, $scope, $translate, authentication, networkActivityTracker, Setting, notify) {
    $scope.languages = ['English', 'French', 'German', 'Spanish', 'Italian'];
    $scope.locales = {English: 'en_US', French: 'fr_FR', German: 'de_DE', Spanish: 'es_ES', Italian: 'it_IT'};
    $scope.selectedLanguage = 'English';
    $scope.cssTheme = authentication.user.Theme;
    $scope.ComposerMode = authentication.user.ComposerMode;
    $scope.LayoutMode = ( $rootScope.layoutMode ) ? ( ( $rootScope.layoutMode === 'rows' ) ? 1 : 0 ) : 0;
    $scope.ViewLayout = authentication.user.ViewLayout;

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

    $scope.toggleThemeJason = function() {
        $rootScope.themeJason = !$rootScope.themeJason;
    };

    $scope.clearTheme = function() {
        $scope.cssTheme = '';
        $scope.saveTheme();
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

    // TODO save this using an API route and remove all instances of $rootScope.layoutMode
    $scope.saveLayoutMode = function(form) {

        var value = parseInt($scope.LayoutMode);
        networkActivityTracker.track(
            Setting.setViewlayout({
                "ViewLayout": value
            }).$promise.then(
                function(response) {
                    if(response.Code === 1000) {
                        authentication.user.LayoutMode = $scope.LayoutMode;
                        notify({message: $translate.instant('LAYOUT_SAVED'), classes: 'notification-success'});
                    } else if (response.Error) {
                        notify({message: response.Error, classes: 'notification-danger'});
                    }
                },
                function(error) {
                    notify({message: 'Error during saving layout mode', classes: 'notification-danger'});
                    $log.error(error);
                }
            )
        );
        if(value === 0) {
            $scope.LayoutMode = value;
            $rootScope.layoutMode = 'columns';
        } else {
            $scope.LayoutMode = value;
            $rootScope.layoutMode = 'rows';
        }

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

    // Not used
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
});
