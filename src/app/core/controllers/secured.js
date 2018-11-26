import _ from 'lodash';

/* @ngInject */
function SecuredController(
    $scope,
    $state,
    addressWithoutKeysManager,
    AppModel,
    authentication,
    blackFridayHandler,
    cacheCounters,
    contactCache,
    desktopNotifications,
    dispatchers,
    eventManager,
    hotkeys,
    mailSettingsModel,
    resurrecter,
    versionInfoModel,
    prepareDraft,
    userType
) {
    const { on, unsubscribe } = dispatchers();
    $scope.mobileMode = AppModel.is('mobile');
    $scope.tabletMode = AppModel.is('tablet');
    $scope.user = authentication.user;
    const setUserType = () => {
        const { isAdmin, isMember, isFree, isSub } = userType();
        $scope.isAdmin = isAdmin;
        $scope.isFree = isFree;

        AppModel.set('isFree', isFree);
        AppModel.set('isPaidMember', isMember);
        AppModel.set('isPaidAdmin', isAdmin);
        AppModel.set('isSubUser', isSub);
    };

    setUserType();

    AppModel.set('isLoggedIn', true); // Shouldn't be there
    AppModel.set('isLocked', false); // Shouldn't be there

    resurrecter.init();
    const bindAppValue = (key, { value }) => $scope.$applyAsync(() => ($scope[key] = value));

    on('AppModel', (e, { type, data = {} }) => {
        type === 'mobile' && bindAppValue('mobileMode', data);
        type === 'tablet' && bindAppValue('tabletMode', data);
    });

    desktopNotifications.request();

    // Enable hotkeys
    if (mailSettingsModel.get('Hotkeys') === 1) {
        hotkeys.bind();
    } else {
        hotkeys.unbind();
    }

    eventManager.initialize();
    // Initialize counters for conversation (total and unread)
    cacheCounters.query();
    // Preload the contact list
    !$state.includes('secured.contacts') && contactCache.load();
    addressWithoutKeysManager.manage().catch(_.noop);

    prepareDraft.init();

    blackFridayHandler();

    versionInfoModel();

    on('updateUser', () => {
        $scope.$applyAsync(() => {
            $scope.user = authentication.user;
            setUserType();
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
