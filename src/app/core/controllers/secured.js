angular.module('proton.core')
    .controller('SecuredController', (
        $rootScope,
        $scope,
        $state,
        authentication,
        cacheCounters,
        CONSTANTS,
        desktopNotifications,
        eventManager,
        generateModal,
        gettextCatalog,
        hotkeys,
        messageActions,
        AppModel,
        attachSignupSubscription
    ) => {
        $scope.inboxSidebar = AppModel.is('inboxSidebar');
        $scope.showSidebar = AppModel.is('showSidebar');
        $scope.mobileMode = AppModel.is('mobile');
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
            (type === 'showSidebar') && bindAppValue(type, data);
        });

        // Set language used for the application-name
        gettextCatalog.setCurrentLanguage(authentication.user.Language);

        // Request for desktop notification
        desktopNotifications.request();

        // Enable hotkeys
        if (authentication.user.Hotkeys === 1) {
            hotkeys.bind();
        } else {
            hotkeys.unbind();
        }

        attachSignupSubscription();

        // Set event ID
        eventManager.start(authentication.user.EventID);

        // Initialize counters for conversation (total and unread)
        cacheCounters.query();

        manageDirtryAddresses();

        $scope.$on('updateUser', () => {
            $scope.$applyAsync(() => {
                $scope.user = authentication.user;
                $scope.isAdmin = authentication.user.Role === CONSTANTS.PAID_ADMIN_ROLE;
                $scope.isFree = authentication.user.Role === CONSTANTS.FREE_USER_ROLE;
            });
        });

        $scope.idDefined = () => ($state.params.id && $state.params.id.length > 0);
        $scope.isMobile = () => AppModel.is('mobile');


        function manageDirtryAddresses() {
            const dirtyAddresses = [];

            authentication.user.Addresses.forEach((address) => {
                if (!address.Keys.length && address.Status === 1 && authentication.user.Private === 1) {
                    dirtyAddresses.push(address);
                }
            });

            if (dirtyAddresses.length && !generateModal.active()) {
                generateModal.activate({
                    params: {
                        title: gettextCatalog.getString('Setting up your Addresses'),
                        message: gettextCatalog.getString('Before you can start sending and receiving emails from your new addresses you need to create encryption keys for them. 4096-bit keys only work on high performance computers. For most users, we recommend using 2048-bit keys.'),
                        addresses: dirtyAddresses,
                        password: authentication.getPassword(),
                        close(success) {
                            if (success) {
                                eventManager.call();
                            }
                            generateModal.deactivate();
                        }
                    }
                });
            }
        }

        $scope.$on('$destroy', () => {
            hotkeys.unbind();
            unsubscribe();
        });
    });
