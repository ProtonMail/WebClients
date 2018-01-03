/* @ngInject */
function SecuredController(
    $rootScope,
    $scope,
    $state,
    authentication,
    cacheCounters,
    contactCache,
    CONSTANTS,
    eventManager,
    hotkeys,
    AppModel,
    desktopNotifications,
    attachSignupSubscription,
    addressWithoutKeysManager,
    resurrecter
) {
    $scope.mobileMode = AppModel.is('mobile');
    $scope.tabletMode = AppModel.is('tablet');
    $scope.user = authentication.user;
    $scope.isAdmin = authentication.user.Role === CONSTANTS.PAID_ADMIN_ROLE;
    $scope.isFree = authentication.user.Role === CONSTANTS.FREE_USER_ROLE;
    $scope.keyPhase = CONSTANTS.KEY_PHASE;
    $rootScope.isLoggedIn = true; // Shouldn't be there
    $rootScope.isLocked = false; // Shouldn't be there

    resurrecter.init();
    const bindAppValue = (key, { value }) => $scope.$applyAsync(() => ($scope[key] = value));
    const unsubscribe = $rootScope.$on('AppModel', (e, { type, data = {} }) => {
        type === 'mobile' && bindAppValue('mobileMode', data);
        type === 'tablet' && bindAppValue('tabletMode', data);
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
    // Preload the contact list
    !$state.includes('secured.contacts') && contactCache.load();
    addressWithoutKeysManager.manage().catch(_.noop);

    $scope.$on('updateUser', () => {
        $scope.$applyAsync(() => {
            $scope.user = authentication.user;
            $scope.isAdmin = authentication.user.Role === CONSTANTS.PAID_ADMIN_ROLE;
            $scope.isFree = authentication.user.Role === CONSTANTS.FREE_USER_ROLE;
        });
    });

    $scope.idDefined = () => $state.params.id && $state.params.id.length > 0;
    $scope.isMobile = () => AppModel.is('mobile');

    $scope.$on('$destroy', () => {
        hotkeys.unbind();
        unsubscribe();
    });
}
export default SecuredController;
