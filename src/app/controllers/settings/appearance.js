angular.module("proton.controllers.Settings")

.controller('AppearanceController', function(
    $log,
    $rootScope,
    $scope,
    $state,
    gettextCatalog,
    $q,
    authentication,
    networkActivityTracker,
    Setting,
    notify) {
    $scope.appearance = {
        locales: [
            {label: gettextCatalog.getString('English', null, 'Default'), key: 'en_US'},
            {label: gettextCatalog.getString('French', null, 'Default'), key: 'fr_FR'}
        ],
        cssTheme: authentication.user.Theme,
        ComposerMode: authentication.user.ComposerMode,
        ViewLayout: authentication.user.ViewLayout,
        MessageButtons: authentication.user.MessageButtons
    };

    $scope.appearance.locale = _.findWhere($scope.appearance.locales, {key: gettextCatalog.getCurrentLanguage()});

    $scope.loadThemeClassic = function() {
        $scope.appearance.cssTheme = "body .pm_button.primary,body .pm_button.success{text-shadow:none!important;color:#fff!important;border-color:transparent!important}.pm_button.link,body .pm_button.primary,body .pm_button.success{border-color:transparent!important}body,body .pm_opensans{font-family:'Lucida Grande',Verdana,Arial,sans-serif}body{font-size:14px}body .composer .meta .pm_button,body .composer header .pm_button,body .pm_buttons .pm_dropdown>a,body .pm_dropdown>a{background:0 0!important;box-shadow:none!important}body .pm_button,body .pm_buttons a{box-shadow:0 1px 1px rgba(0,0,0,.1),inset 0 1px 0 rgba(255,255,255,.1)!important}body .pm_button{background-image:-webkit-linear-gradient(#fff,#e6e6e6)!important;background-image:linear-gradient(#fff,#e6e6e6)!important;background:-moz-linear-gradient(#fff,#e6e6e6)!important}body .pm_button.primary{background:#7575a3!important;background-image:-webkit-linear-gradient(#7575a3,#669)!important;background-image:linear-gradient(#7575a3,#669)!important}body .pm_button.success{background:#93bf73!important;background-image:-webkit-linear-gradient(#93bf73 ,#aecf96)!important;background-image:linear-gradient(#93bf73 ,#aecf96)!important}body .pm_buttons a{background-image:-webkit-linear-gradient(#fff,#e6e6e6)!important;background-image:linear-gradient(#fff,#e6e6e6)!important;background:-moz-linear-gradient(#fff,#e6e6e6)!important}body #pm_composer .composer header,body body.secure section#pm_sidebarMobile,body header#pm_header .logo,body header#pm_header.no-auth,body html.protonmail body,body section.sidebar,header#pm_header-desktop a.logo{background:#333!important}body header#pm_header form.searchForm fieldset{background-color:#404040!important}body header#pm_header form.searchForm fieldset button[type=button]{background:#666!important}body header#pm_header ul.navigation li.active a,body header#pm_header ul.navigation li:hover a{border-top-color:#333!important}@media (max-width:400px){body header#pm_header form.searchForm{background:#333!important}}#pm_settings .pm_tabs,body #pm_conversations.columns .list div.message.active,body #pm_conversations.columns .list div.message.active article .pm_labels .pm_label,body #pm_conversations.columns .list div.message.active header span.time,body #pm_conversations.columns .list div.message.unread.active,body #pm_conversations.columns .list div.message.unread.active header span.time,body #pm_conversations.columns .list div.message.unread.active header span.time article .pm_labels .pm_label,body header#pm_header,body header#pm_header-desktop{background:#555!important}body #pm_conversations.columns .list div.message.unread.active header span.time article .pm_labels .pm_label{box-shadow:0 0 0 4px #555!important}body .pm_table th{color:#555!important}#pm_settings .pm_tabs li a.pm_button{color:#000!important}.pm_button.link{background-color:transparent!important;color:#8286c5;text-decoration:underline;box-shadow:none!important;background-image:none!important}header#pm_header-desktop ul.navigation .pm_dropdown .pm_button.primary{background: #7575a3!important;background-image: -webkit-linear-gradient(#7575a3,#669)!important;background-image: linear-gradient(#7575a3,#669)!important}";
        $scope.saveTheme();
    };

    $scope.saveTheme = function(form) {
        var deferred = $q.defer();

        networkActivityTracker.track(
            Setting.theme({Theme: $scope.appearance.cssTheme})
            .then(function(result) {
                if (result.data && result.data.Code === 1000) {
                    authentication.user.Theme = $scope.appearance.cssTheme;
                    notify({message: gettextCatalog.getString('Theme saved', null, 'Default'), classes: 'notification-success'});
                    deferred.resolve();
                } else if (result.data && result.data.Error) {
                    notify({message: result.data.Error, classes: 'notification-danger'});
                    deferred.reject();
                } else {
                    notify({message: gettextCatalog.getString('Unable to save your changes, please try again.', null, 'Default'), classes: 'notification-danger'});
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
        $scope.saveTheme()
        .then(function() {
            // Reload the page
            $state.go($state.current, {}, {reload: true});
        });
    };

    $scope.saveComposerMode = function(form) {
        var value = parseInt($scope.appearance.ComposerMode);

        networkActivityTracker.track(
            Setting.setComposerMode({ComposerMode: value})
            .then(function(result) {
                if(result.data && result.data.Code === 1000) {
                    authentication.user.ComposerMode = value;
                    notify({message: gettextCatalog.getString('Compose mode saved', null, 'Default'), classes: 'notification-success'});
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
                    authentication.user.ViewLayout = value;

                    if (value === 0) {
                        $rootScope.layoutMode = 'columns';
                    } else {
                        $rootScope.layoutMode = 'rows';
                    }

                    notify({message: gettextCatalog.getString('Layout saved', null, 'Default'), classes: 'notification-success'});
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
            gettextCatalog.setCurrentLanguage(lang)
            .then(function(result) {
                notify(gettextCatalog.getString('Default language changed', null, 'Default'));
            });
        });
    };

    $scope.saveButtonsPosition = function(form) {
        networkActivityTracker.track(
            Setting.setMessageStyle({ MessageButtons: $scope.appearance.MessageButtons })
            .then(function(result) {
                if (result.data && result.data.Code === 1000) {
                    authentication.user.MessageButtons = $scope.appearance.MessageButtons;
                    notify({message: gettextCatalog.getString('Buttons position saved', null, 'Default'), classes: 'notification-success'});
                } else if (result.data && result.data.Error) {
                    notify({message: result.data.Error, classes: 'notification-danger'});
                }
            })
        );
    };
});
