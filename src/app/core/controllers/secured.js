import _ from 'lodash';

/* @ngInject */
function SecuredController(
    $rootScope,
    $scope,
    $state,
    addressWithoutKeysManager,
    AppModel,
    attachSignupSubscription,
    authentication,
    cacheCounters,
    CONSTANTS,
    contactCache,
    desktopNotifications,
    eventManager,
    hotkeys,
    mailSettingsModel,
    resurrecter,
    userType
) {
    const unsubscribe = [];
    $scope.mobileMode = AppModel.is('mobile');
    $scope.tabletMode = AppModel.is('tablet');
    $scope.user = authentication.user;
    const setUserType = () => {
        const { isAdmin, isFree } = userType();
        $scope.isAdmin = isAdmin;
        $scope.isFree = isFree;
    };
    setUserType();
    $rootScope.isLoggedIn = true; // Shouldn't be there
    $rootScope.isLocked = false; // Shouldn't be there

    resurrecter.init();
    const bindAppValue = (key, { value }) => $scope.$applyAsync(() => ($scope[key] = value));

    unsubscribe.push(
        $rootScope.$on('AppModel', (e, { type, data = {} }) => {
            type === 'mobile' && bindAppValue('mobileMode', data);
            type === 'tablet' && bindAppValue('tabletMode', data);
        })
    );

    desktopNotifications.request();

    // Enable hotkeys
    if (mailSettingsModel.get('Hotkeys') === 1) {
        hotkeys.bind();
    } else {
        hotkeys.unbind();
    }

    attachSignupSubscription();
    eventManager.start(authentication.user.EventID);
    // Initialize counters for conversation (total and unread)
    cacheCounters.query();
    // Preload the contact list
    !$state.includes('secured.contacts') && contactCache.load();
    addressWithoutKeysManager.manage().catch(_.noop);

    unsubscribe.push(
        $rootScope.$on('updateUser', () => {
            $scope.$applyAsync(() => {
                $scope.user = authentication.user;
                setUserType();
            });
        })
    );

    $scope.idDefined = () => $state.params.id && $state.params.id.length > 0;
    $scope.isMobile = () => AppModel.is('mobile');
    $scope.$on('$destroy', () => {
        hotkeys.unbind();
        unsubscribe.forEach((cb) => cb());
        unsubscribe.length = 0;
    });
}
export default SecuredController;
