angular.module('proton.core')
    .controller('SecuredController', (
        $rootScope,
        $scope,
        $state,
        authentication,
        cacheCounters,
        CONSTANTS,
        eventManager,
        hotkeys,
        AppModel,
        desktopNotifications,
        attachSignupSubscription,
        addressWithoutKeysManager
    ) => {
        $scope.inboxSidebar = AppModel.is('inboxSidebar');
        $scope.showSidebar = AppModel.is('showSidebar');
        $scope.settingsSidebar = AppModel.is('settingsSidebar');
        $scope.contactSidebar = AppModel.is('contactSidebar');
        $scope.mobileMode = AppModel.is('mobile');
        $scope.tabletMode = AppModel.is('tablet');
        $scope.user = authentication.user;
        $scope.isAdmin = authentication.user.Role === CONSTANTS.PAID_ADMIN_ROLE;
        $scope.isFree = authentication.user.Role === CONSTANTS.FREE_USER_ROLE;
        $scope.keyPhase = CONSTANTS.KEY_PHASE;
        $rootScope.isLoggedIn = true; // Shouldn't be there
        $rootScope.isLocked = false; // Shouldn't be there

        const bindAppValue = (key, { value }) => $scope.$applyAsync(() => $scope[key] = value);
        const unsubscribe = $rootScope.$on('AppModel', (e, { type, data = {} }) => {
            (type === 'inboxSidebar') && bindAppValue(type, data);
            (type === 'mobile') && bindAppValue('mobileMode', data);
            (type === 'tablet') && bindAppValue('tabletMode', data);
            (type === 'showSidebar') && bindAppValue(type, data);
            (type === 'settingsSidebar') && bindAppValue(type, data);
            (type === 'contactSidebar') && bindAppValue(type, data);
        });

        desktopNotifications.request();

        // Enable hotkeys
        if (authentication.user.Hotkeys === 1) {
            hotkeys.bind();
        } else {
            hotkeys.unbind();
        }

        attachSignupSubscription();
        eventManager.start(authentication.user.EventID);
        // Initialize counters for conversation (total and unread)
        cacheCounters.query();
        addressWithoutKeysManager.manage()
            .catch(_.noop);

        $scope.$on('updateUser', () => {
            $scope.$applyAsync(() => {
                $scope.user = authentication.user;
                $scope.isAdmin = authentication.user.Role === CONSTANTS.PAID_ADMIN_ROLE;
                $scope.isFree = authentication.user.Role === CONSTANTS.FREE_USER_ROLE;
            });
        });

        $scope.idDefined = () => ($state.params.id && $state.params.id.length > 0);
        $scope.isMobile = () => AppModel.is('mobile');

        $scope.$on('$destroy', () => {
            hotkeys.unbind();
            unsubscribe();
        });
    });
