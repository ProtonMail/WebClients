/* @ngInject */
function AppearanceController(
    $log,
    $rootScope,
    $scope,
    $state,
    $window,
    gettextCatalog,
    $q,
    CONSTANTS,
    networkActivityTracker,
    eventManager,
    settingsMailApi,
    mailSettingsModel,
    notification
) {
    const unsubscribe = [];
    const { Theme, ComposerMode, ViewLayout, MessageButtons, ViewMode } = mailSettingsModel.get();
    $scope.appearance = {
        cssTheme: Theme,
        ComposerMode: ComposerMode,
        ViewLayout: ViewLayout,
        MessageButtons: MessageButtons,
        viewMode: !ViewMode // BE data is reversed
    };

    unsubscribe.push($rootScope.$on('changeViewMode', changeViewMode));
    $scope.$on('$destroy', () => {
        unsubscribe.forEach((cb) => cb());
        unsubscribe.length = 0;
    });
    $scope.loadThemeClassic = function() {
        $scope.appearance.cssTheme = 'CLASSIC';
        $scope.saveTheme();
    };

    $scope.saveTheme = () => {
        const promise = settingsMailApi
            .updateTheme({ Theme: $scope.appearance.cssTheme })
            .then(eventManager.call)
            .then(() => {
                notification.success(gettextCatalog.getString('Theme saved', null, 'Info'));
            });

        networkActivityTracker.track(promise);

        return promise;
    };

    $scope.clearTheme = function() {
        // Reset the theme value
        $scope.appearance.cssTheme = '';
        // Save the theme
        $scope.saveTheme();
    };

    $scope.saveComposerMode = function() {
        const value = parseInt($scope.appearance.ComposerMode, 10);

        const promise = settingsMailApi
            .updateComposerMode({ ComposerMode: value })
            .then(eventManager.call)
            .then(() => {
                notification.success(gettextCatalog.getString('Compose mode saved', null, 'Info'));
            });

        networkActivityTracker.track(promise);
    };

    $scope.saveLayoutMode = function() {
        const value = $scope.appearance.ViewLayout;
        const promise = settingsMailApi
            .updateViewLayout({ ViewLayout: value })
            .then(eventManager.call)
            .then(() => {
                notification.success(gettextCatalog.getString('Layout saved', null));
            });

        networkActivityTracker.track(promise);
    };

    $scope.saveButtonsPosition = () => {
        const MessageButtons = $scope.appearance.MessageButtons;
        const promise = settingsMailApi
            .updateMessageButtons({ MessageButtons })
            .then(eventManager.call)
            .then(() => {
                notification.success(gettextCatalog.getString('Buttons position saved', null, 'Info'));
            });

        networkActivityTracker.track(promise);

        return promise;
    };

    function changeViewMode(event, { status }) {
        const ViewMode = status ? CONSTANTS.CONVERSATION_VIEW_MODE : CONSTANTS.MESSAGE_VIEW_MODE; // Be careful, BE is reversed

        $rootScope.$emit('appearance', { type: 'changingViewMode' });

        const promise = settingsMailApi
            .updateViewMode({ ViewMode })
            .then(() => eventManager.call())
            .then(() => {
                notification.success(gettextCatalog.getString('View mode saved', null, 'Info'));
                $rootScope.$emit('appearance', { type: 'viewModeChanged' });
            });

        networkActivityTracker.track(promise);

        return promise;
    }
}
export default AppearanceController;
