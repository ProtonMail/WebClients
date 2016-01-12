angular.module("proton.controllers.Settings")

.controller('AppearanceController', function($log, $rootScope, $scope, $translate, authentication, networkActivityTracker, Setting, notify) {
    $scope.languages = ['English', 'French', 'German', 'Spanish', 'Italian'];
    $scope.locales = {English: 'en_US', French: 'fr_FR', German: 'de_DE', Spanish: 'es_ES', Italian: 'it_IT'};
    $scope.selectedLanguage = 'English';
    $scope.cssTheme = authentication.user.Theme;
    $scope.ComposerMode = authentication.user.ComposerMode;
    $scope.LayoutMode = ( $rootScope.layoutMode ) ? ( ( $rootScope.layoutMode === 'rows' ) ? 1 : 0 ) : 0;
    $scope.ViewLayout = authentication.user.ViewLayout;

    $scope.toggleThemeHC = function() {
        $rootScope.themeHC = !$rootScope.themeHC;
    };
    $scope.enableThemeOnyx = function() {
        $scope.cssTheme = "body,body .pm_opensans{font-family:'Lucida Grande',Verdana,Arial,sans-serif}body{font-size:14px}body .composer .meta .pm_button,body .composer header .pm_button,body .pm_buttons .pm_dropdown>a,body .pm_dropdown>a{background:none!important;box-shadow:none!important}body .pm_button,body .pm_buttons a{box-shadow:0 1px 1px rgba(0,0,0,.1),inset 0 1px 0 rgba(255,255,255,.1)!important}body .pm_button{background-image:-webkit-linear-gradient(#fff,#e6e6e6)!important;background-image:linear-gradient(#fff,#e6e6e6)!important;background:-moz-linear-gradient(#fff,#e6e6e6)!important}body .pm_button.primary{background:#7575a3!important;background-image:-webkit-linear-gradient(#7575a3,#669)!important;background-image:linear-gradient(#7575a3,#669)!important;text-shadow:none!important;color:#fff!important;border-color:transparent!important}body .pm_buttons a{background-image:-webkit-linear-gradient(#fff,#e6e6e6)!important;background-image:linear-gradient(#fff,#e6e6e6)!important;background:-moz-linear-gradient(#fff,#e6e6e6)!important}body #pm_composer .composer header,body body.secure section#pm_sidebarMobile,body header#pm_header .logo,body header#pm_header.no-auth,body html.protonmail body,body section.sidebar{background:#333!important}body header#pm_header form.searchForm fieldset{background-color:#404040!important}body header#pm_header form.searchForm fieldset button[type=button]{background:#666!important}body header#pm_header ul.navigation li.active a,body header#pm_header ul.navigation li:hover a{border-top-color:#333!important}@media (max-width:400px){body header#pm_header form.searchForm{background:#333!important}}body #pm_conversations.columns .list div.message.active,body #pm_conversations.columns .list div.message.active article .pm_labels .pm_label,body #pm_conversations.columns .list div.message.active header span.time,body #pm_conversations.columns .list div.message.unread.active,body #pm_conversations.columns .list div.message.unread.active header span.time,body #pm_conversations.columns .list div.message.unread.active header span.time article .pm_labels .pm_label,body header#pm_header{background:#555!important}body #pm_conversations.columns .list div.message.unread.active header span.time article .pm_labels .pm_label{box-shadow:0 0 0 4px #555!important}body .pm_table th{color:#555!important}";
        $scope.saveTheme();
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

    $scope.saveLayoutMode = function(form) {
        var value = parseInt($scope.LayoutMode);

        networkActivityTracker.track(
            Setting.setViewlayout({
                "ViewLayout": value
            }).$promise.then(
                function(response) {
                    if(response.Code === 1000) {
                        if(value === 0) {
                            $rootScope.layoutMode = 'columns';
                        } else {
                            $rootScope.layoutMode = 'rows';
                        }

                        authentication.user.LayoutMode = value;
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
