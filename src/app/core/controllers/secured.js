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
    $scope.mobileMode = AppModel.is('mobile');
    $scope.tabletMode = AppModel.is('tablet');
    $scope.user = authentication.user;
    const setUserType = () => {
        const { isAdmin, isFree } = userType();
        $scope.isAdmin = isAdmin;
        $scope.isFree = isFree;
    };
    setUserType();
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

    function updateView() {
        const $main = document.querySelector('#pm_main');

        if ($main) {
            const { ViewLayout } = mailSettingsModel.get();
            const action = ViewLayout === CONSTANTS.ROW_MODE ? 'add' : 'remove';

            $main.classList[action]('rows');
        }
    }

    $scope.$on('updateUser', () => {
        $scope.$applyAsync(() => {
            $scope.user = authentication.user;
            setUserType();
        });
    });

    $scope.$on('mailSettings', (event, { type = '' }) => {
        if (type === 'updated') {
            updateView();
        }
    });

    $scope.idDefined = () => $state.params.id && $state.params.id.length > 0;
    $scope.isMobile = () => AppModel.is('mobile');
    updateView();
    $scope.$on('$destroy', () => {
        hotkeys.unbind();
        unsubscribe();
    });
}
export default SecuredController;
