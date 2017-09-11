angular.module('proton.settings')
    .controller('AppearanceController', (
        $log,
        $rootScope,
        $scope,
        $state,
        $window,
        gettextCatalog,
        $q,
        authentication,
        CONSTANTS,
        networkActivityTracker,
        eventManager,
        settingsApi,
        notification) => {
        const unsubscribe = [];
        $scope.appearance = {
            cssTheme: authentication.user.Theme,
            ComposerMode: authentication.user.ComposerMode,
            ViewLayout: authentication.user.ViewLayout,
            MessageButtons: authentication.user.MessageButtons,
            viewMode: !(authentication.user.ViewMode) // BE data is reversed
        };

        unsubscribe.push($rootScope.$on('changeViewMode', changeViewMode));
        $scope.$on('$destroy', () => {
            unsubscribe.forEach((cb) => cb());
            unsubscribe.length = 0;
        });
        $scope.loadThemeClassic = function () {
            $scope.appearance.cssTheme = 'CLASSIC';
            $scope.saveTheme();
        };

        $scope.saveTheme = function () {
            const deferred = $q.defer();

            networkActivityTracker.track(
                settingsApi.theme({ Theme: $scope.appearance.cssTheme })
                    .then((result) => {
                        if (result.data && result.data.Code === 1000) {
                            notification.success(gettextCatalog.getString('Theme saved', null));
                            eventManager.call().then(() => {
                                deferred.resolve();
                            });
                        } else if (result.data && result.data.Error) {
                            notification.error(result.data.Error);
                            deferred.reject();
                        } else {
                            notification.error(gettextCatalog.getString('Unable to save your changes, please try again.', null, 'Error'));
                            deferred.reject();
                        }
                    })
            );

            return deferred.promise;
        };

        $scope.clearTheme = function () {
            // Reset the theme value
            $scope.appearance.cssTheme = '';
            // Save the theme
            $scope.saveTheme();
        };

        $scope.saveComposerMode = function () {
            const value = parseInt($scope.appearance.ComposerMode, 10);

            networkActivityTracker.track(
                settingsApi.setComposerMode({ ComposerMode: value })
                    .then((result) => {
                        if (result.data && result.data.Code === 1000) {
                            notification.success(gettextCatalog.getString('Compose mode saved', null, 'Info'));
                            return eventManager.call();
                        } else if (result.data && result.data.Error) {
                            notification.error(result.data.Error);
                        }
                    })
            );
        };

        $scope.saveLayoutMode = function () {
            const value = $scope.appearance.ViewLayout;

            networkActivityTracker.track(
                settingsApi.setViewlayout({ ViewLayout: value })
                    .then((result) => {
                        if (result.data && result.data.Code === 1000) {
                            notification.success(gettextCatalog.getString('Layout saved', null));
                            return eventManager.call();
                        } else if (result.data && result.data.Error) {
                            notification.error(result.data.Error);
                        }
                    })
            );
        };

        $scope.saveButtonsPosition = () => {
            const MessageButtons = $scope.appearance.MessageButtons;
            const promise = settingsApi.setMessageStyle({ MessageButtons })
                .then((result) => {
                    if (result.data && result.data.Code === 1000) {
                        return eventManager.call()
                            .then(() => {
                                notification.success(gettextCatalog.getString('Buttons position saved', null, 'Info'));
                                return Promise.resolve();
                            });
                    } else if (result.data && result.data.Error) {
                        return Promise.reject(result.data.Error);
                    }
                });

            networkActivityTracker.track(promise);

            return promise;
        };

        function changeViewMode(event, { status }) {
            const ViewMode = status ? CONSTANTS.CONVERSATION_VIEW_MODE : CONSTANTS.MESSAGE_VIEW_MODE; // Be careful, BE is reversed

            $rootScope.$emit('appearance', { type: 'changingViewMode' });

            const promise = settingsApi.setViewMode({ ViewMode })
                .then(({ data = {} } = {}) => {
                    if (data.Error) {
                        throw new Error(data.Error);
                    }
                    return data;
                })
                .then(() => eventManager.call())
                .then(() => {
                    notification.success(gettextCatalog.getString('View mode saved', null, 'Info'));
                    $rootScope.$emit('appearance', { type: 'viewModeChanged' });
                });

            networkActivityTracker.track(promise);

            return promise;
        }
    });
