angular.module("proton.controllers.Settings")

.controller('AppearanceController', function(
    $log,
    $rootScope,
    $scope,
    $state,
    $translate,
    authentication,
    networkActivityTracker,
    Setting,
    notify) {
    $scope.appearance = {
        languages: ['English', 'French', 'German', 'Spanish', 'Italian', 'Dutch'],
        locales: {English: 'en_US', French: 'fr_FR', German: 'de_DE', Spanish: 'es_ES', Italian: 'it_IT', Dutch: 'nl_NL'},
        selectedLanguage: 'English',
        cssTheme: authentication.user.Theme,
        ComposerMode: authentication.user.ComposerMode,
        ViewLayout: authentication.user.ViewLayout,
        MessageButtons: authentication.user.MessageButtons
    };

    $scope.loadThemeClassic = function() {
        $scope.appearance.cssTheme = "body .pm_button.primary,body .pm_button.success{text-shadow:none!important;color:#fff!important;border-color:transparent!important}.pm_button.link,body .pm_button.primary,body .pm_button.success{border-color:transparent!important}body,body .pm_opensans{font-family:'Lucida Grande',Verdana,Arial,sans-serif}body{font-size:14px}body .composer .meta .pm_button,body .composer header .pm_button,body .pm_buttons .pm_dropdown>a,body .pm_dropdown>a{background:0 0!important;box-shadow:none!important}body .pm_button,body .pm_buttons a{box-shadow:0 1px 1px rgba(0,0,0,.1),inset 0 1px 0 rgba(255,255,255,.1)!important}body .pm_button{background-image:-webkit-linear-gradient(#fff,#e6e6e6)!important;background-image:linear-gradient(#fff,#e6e6e6)!important;background:-moz-linear-gradient(#fff,#e6e6e6)!important}body .pm_button.primary{background:#7575a3!important;background-image:-webkit-linear-gradient(#7575a3,#669)!important;background-image:linear-gradient(#7575a3,#669)!important}body .pm_button.success{background:#93bf73!important;background-image:-webkit-linear-gradient(#93bf73 ,#aecf96)!important;background-image:linear-gradient(#93bf73 ,#aecf96)!important}body .pm_buttons a{background-image:-webkit-linear-gradient(#fff,#e6e6e6)!important;background-image:linear-gradient(#fff,#e6e6e6)!important;background:-moz-linear-gradient(#fff,#e6e6e6)!important}body #pm_composer .composer header,body body.secure section#pm_sidebarMobile,body header#pm_header .logo,body header#pm_header.no-auth,body html.protonmail body,body section.sidebar,header#pm_header-desktop a.logo{background:#333!important}body header#pm_header form.searchForm fieldset{background-color:#404040!important}body header#pm_header form.searchForm fieldset button[type=button]{background:#666!important}body header#pm_header ul.navigation li.active a,body header#pm_header ul.navigation li:hover a{border-top-color:#333!important}@media (max-width:400px){body header#pm_header form.searchForm{background:#333!important}}#pm_settings .pm_tabs,body #pm_conversations.columns .list div.message.active,body #pm_conversations.columns .list div.message.active article .pm_labels .pm_label,body #pm_conversations.columns .list div.message.active header span.time,body #pm_conversations.columns .list div.message.unread.active,body #pm_conversations.columns .list div.message.unread.active header span.time,body #pm_conversations.columns .list div.message.unread.active header span.time article .pm_labels .pm_label,body header#pm_header,body header#pm_header-desktop{background:#555!important}body #pm_conversations.columns .list div.message.unread.active header span.time article .pm_labels .pm_label{box-shadow:0 0 0 4px #555!important}body .pm_table th{color:#555!important}#pm_settings .pm_tabs li a.pm_button{color:#000!important}.pm_button.link{background-color:transparent!important;color:#8286c5;text-decoration:underline;box-shadow:none!important;background-image:none!important}";
        $scope.saveTheme();
    };

    $scope.saveTheme = function(form) {
        networkActivityTracker.track(
            Setting.theme({
                "Theme": $scope.appearance.cssTheme
            }).$promise
            .then(
                function(response) {
                    if(response.Code === 1000) {
                        authentication.user.Theme = $scope.appearance.cssTheme;
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
        $scope.appearance.cssTheme = '';
        $scope.saveTheme();
    };

    $scope.saveComposerMode = function(form) {
        var value = parseInt($scope.appearance.ComposerMode);

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
        var value = $scope.appearance.ViewLayout;
        var previous = authentication.user.ViewLayout;

        var apply = function(value) {
            authentication.user.ViewLayout = value;

            if(value === 0) {
                console.log('$rootScope.layoutMode: set columns');
                $rootScope.layoutMode = 'columns';
            } else {
                console.log('$rootScope.layoutMode: set rows');
                $rootScope.layoutMode = 'rows';
            }
        };

        var error = function(error) {
            $log.error(error);
            notify({message: 'Error during saving layout mode', classes: 'notification-danger'});
            apply(previous);
        };

        apply(value);

        networkActivityTracker.track(
            Setting.setViewlayout({
                "ViewLayout": value
            }).$promise.then(
                function(response) {
                    if(response.Code === 1000) {
                        notify({message: $translate.instant('LAYOUT_SAVED'), classes: 'notification-success'});
                    } else if (response.Error) {
                        error(response.Error);
                    } else {
                        error();
                    }
                },
                function(error) {
                    error(error);
                }
            )
        );
    };

    // Not used
    $scope.saveDefaultLanguage = function() {
        var lang = $scope.appearance.locales[$scope.appearance.selectedLanguage];

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

    $scope.saveButtonsPosition = function(form) {
        if ($scope.appearance.MessageButtons !== authentication.user.MessageButtons) {
            networkActivityTracker.track(
                Setting.setMessageStyle({ MessageButtons: $scope.appearance.MessageButtons }).$promise.then(function(response) {
                    if (response.Code === 1000) {
                        authentication.user.MessageButtons = $scope.appearance.MessageButtons;
                        notify({message: $translate.instant('BUTTONS_POSITION_SAVED'), classes: 'notification-success'});
                    }
                    else if (response.Error) {
                        notify({message: response.Error, classes: 'notification-danger'});
                    }
                    else {
                        $log.error(response);
                    }
                }, function(error) {
                    $log.error(error);
                })
            );
        }
    };
});
