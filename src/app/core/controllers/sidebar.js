angular.module('proton.core')
.controller('SidebarController', (
    $http,
    $log,
    $rootScope,
    $scope,
    $state,
    $stateParams,
    $timeout,
    gettextCatalog,
    $filter,
    authentication,
    cache,
    CONFIG,
    CONSTANTS,
    eventManager,
    Label,
    Message,
    cacheCounters,
    networkActivityTracker,
    notify,
    tools
) => {

    // Variables
    const unsubscribe = [];
    let timeoutRefresh;

    $scope.labels = _.sortBy(authentication.user.Labels, 'Order');
    $scope.dateVersion = CONFIG.date_version;
    $scope.droppedMessages = [];
    $scope.droppableOptions = {
        accept: '.ui-draggable',
        activeClass: 'drop-active',
        hoverClass: 'drop-hover'
    };

    $scope.appVersion = CONFIG.app_version;

    $scope.hideMobileSidebar = function () {
        $rootScope.$broadcast('sidebarMobileToggle', false);
    };

    // Listeners
    unsubscribe.push($rootScope.$on('deleteLabel', () => {
        $scope.$applyAsync(() => {
            $scope.labels = _.sortBy(authentication.user.Labels, 'Order');
        });
    }));

    unsubscribe.push($rootScope.$on('createLabel', () => {
        $scope.$applyAsync(() => {
            $scope.labels = _.sortBy(authentication.user.Labels, 'Order');
        });
    }));

    unsubscribe.push($rootScope.$on('updateLabel', () => {
        $scope.$applyAsync(() => {
            $scope.labels = _.sortBy(authentication.user.Labels, 'Order');
        });
    }));

    unsubscribe.push($rootScope.$on('updateLabels', () => {
        $scope.$applyAsync(() => {
            $scope.labels = _.sortBy(authentication.user.Labels, 'Order');
        });
    }));

    $scope.$on('$destroy', () => {
        unsubscribe.forEach((cb) => cb());
        unsubscribe.length = 0;
        $timeout.cancel(timeoutRefresh);
    });

    /**
     * Send request to get the last event, empty the cache for the current mailbox and then refresh the content automatically
     */
    $scope.lastEvent = function () {

        // Start to spin icon on the view
        $scope.spinMe = true;

        // Cancel
        $timeout.cancel(timeoutRefresh);

        // Debounce
        timeoutRefresh = $timeout(() => {
            // Get the latest event
            eventManager.call().then(() => {
                // Stop spin icon
                $scope.spinMe = false;
            }, (error) => {
                $log.error(error);
                // Stop spin icon
                $scope.spinMe = false;
            });
        }, 500);
    };

    /**
     * Returns a hexidecimal string for label colors
     * @return {String} "#333" or "#cc9999"
     */
    $scope.color = function (label) {
        if (label && label.Color) {
            return {
                color: label.Color
            };
        }

        // TODO log an error here that the label has no color.
        return {
            color: '#CCCCCC'
        };
    };

    /**
     * Open folder
     * @param {String} route
     */
    $scope.goTo = (route) => {
        const sameRoute = $state.$current.name === route && !$stateParams.filter;
        const firstPage = $stateParams.page === 1 || angular.isUndefined($stateParams.page);
        const params = { page: null, filter: null, sort: null, trashspam: null };

        if (sameRoute === true && firstPage === true) {
            // Hide sidebar for mobile
            $scope.hideMobileSidebar();
            // Call last event
            $scope.lastEvent();
        } else {
            $state.go(route, params); // remove the older parameters
        }
    };

    /**
     * Open label folder
     * @param {Object} label
     */
    $scope.goToLabel = function (label) {
        const params = { page: null, filter: null, sort: null, label: label.ID };

        $state.go('secured.label', params);
    };

    /**
     * Return if the folder need to be `active`
     */
    $scope.activeLabel = function (label) {
        return $stateParams.label === label.ID;
    };

    /**
     * Returns a string for the storage bar
     * @return {String} "1.25/10 GB"
     */
    $scope.renderStorageBar = function () {
        return tools.renderStorageBar(authentication.user.UsedSpace, authentication.user.MaxSpace);
    };

    /**
     * Returns the number of unread messages in a location
     * @param mailbox {String} name indentifier for folder
     * @param id {Integer} labelID for a label
     * @return {Integer}
     */
    $scope.unread = (mailbox, id) => {
        let result;
        const type = tools.typeList(mailbox);
        const folderID = (mailbox === 'label') ? id : CONSTANTS.MAILBOX_IDENTIFIERS[mailbox];
        const count = (type === 'conversation') ? cacheCounters.unreadConversation(folderID) : cacheCounters.unreadMessage(folderID);

        if (count === undefined) {
            // THIS IS A BUG.
            // TODO: WHY IS THIS UNDEFINED!
            result = '';
        } else if (count <= 0) {
            result = '';
        } else if (count > 1000) {
            result = '(999+)';
        } else {
            result = '(' + count + ')';
        }

        return result;
    };
});
