angular.module("proton.controllers.Sidebar", ["proton.constants"])

.controller('SidebarController', function(
    $http,
    $log,
    $rootScope,
    $scope,
    $state,
    $stateParams,
    $timeout,
    $translate,
    $filter,
    authentication,
    cache,
    CONFIG,
    CONSTANTS,
    eventManager,
    Label,
    labelModal,
    Message,
    cacheCounters,
    networkActivityTracker,
    notify,
    tools
) {

    // Variables
    var mailboxes = CONSTANTS.MAILBOX_IDENTIFIERS;
    var timeoutRefresh;
    $scope.labels = authentication.user.Labels;
    $scope.dateVersion = CONFIG.date_version;
    $scope.droppedMessages = [];
    $scope.droppableOptions = {
        accept: '.ui-draggable',
        activeClass: 'drop-active',
        hoverClass: 'drop-hover'
    };

    $scope.appVersion = CONFIG.app_version;

    $scope.hideMobileSidebar = function() {
        $rootScope.$broadcast('sidebarMobileToggle', false);
    };

    // Listeners
    $scope.$on('createLabel', function(event) { $scope.createLabel(); });
    $scope.$on('$destroy', function(event) {
        $timeout.cancel(timeoutRefresh);
    });

    /**
     * Open modal to create a new label
     */
    $scope.createLabel = function() {
        labelModal.activate({
            params: {
                title: $translate.instant('CREATE_NEW_LABEL'),
                create: function(name, color) {
                    // already exist?
                    var exist = _.findWhere(authentication.user.Labels, {Name: name});

                    if(angular.isUndefined(exist)) {
                        networkActivityTracker.track(
                            Label.create({
                                Name: name,
                                Color: color,
                                Display: 1
                            }).then(function(result) {
                                var data = result.data;

                                if(angular.isDefined(data) && data.Code === 1000) {
                                    authentication.user.Labels.push(data.Label);
                                    cacheCounters.add(data.Label.ID);
                                    notify({message: $translate.instant('LABEL_CREATED'), classes: 'notification-success'});
                                    labelModal.deactivate();
                                } else if (angular.isDefined(data) && angular.isDefined(data.Error)) {
                                    notify({message: data.Error, classes: 'notification-danger'});
                                    $log.error(result);
                                }
                            }, function(error) {
                                notify({message: 'Error during the label creation request', classes: 'notification-danger'});
                                $log.error(error);
                            })
                        );
                    } else {
                        notify({message: $translate.instant('LABEL_NAME_ALREADY_EXISTS'), classes: 'notification-danger'});
                        labelModal.deactivate();
                    }
                },
                cancel: function() {
                    labelModal.deactivate();
                }
            }
        });
    };

    /**
     * Send request to get the last event, empty the cache for the current mailbox and then refresh the content automatically
     */
    $scope.lastEvent = function() {
        var mailbox = tools.currentMailbox();

        // Start to spin icon on the view
        $scope.spinMe = true;

        // Cancel
        $timeout.cancel(timeoutRefresh);

        // Debounce
        timeoutRefresh = $timeout(function() {
            // Get the latest event
            eventManager.call().then(function() {
                // Clear cache for the current mailbox
                cache.empty(mailbox);
                // Stop spin icon
                $scope.spinMe = false;
            }, function(error) {
                $log.error(error);
                // Stop spin icon
                $scope.spinMe = false;
            });
        }, 500);
    };

    /**
     * Call event to open new composer
     */
    $scope.compose = function() {
        $rootScope.$broadcast('newMessage');
    };

    /**
     * Returns a hexidecimal string for label colors
     * @return {String} "#333" or "#cc9999"
     */
    $scope.color = function(label) {
        if (label && label.Color) {
            return {
                color: label.Color
            };
        }
        else {
            // TODO log an error here that the label has no color.
            return {
                color: '#CCCCCC'
            };
        }
    };

    /**
     * Open folder
     * @param {String} route
     */
    $scope.goTo = function(route) {
        var sameFolder = $state.$current.name === route;
        var firstPage = $stateParams.page === 1 || angular.isUndefined($stateParams.page);
        var params = {page: null, filter: null, sort: null};

        // Hide sidebar for mobile
        $scope.hideMobileSidebar();

        // Call last event if first page and same folder
        if(sameFolder === true && firstPage === true) {
            $scope.lastEvent();
        }

        $state.go(route, params); // remove the older parameters
    };

    /**
     * Open label folder
     * @param {Object} label
     */
    $scope.goToLabel = function(label) {
        var params = {page: undefined, filter: undefined, sort: undefined, label: label.ID};

        $state.go('secured.label', params);
    };

    /**
     * Return if the folder need to be `active`
     */
    $scope.activeLabel = function(label) {
        return $stateParams.label === label.ID;
    };

    /**
     * Returns a string for the storage bar
     * @return {String} "1.25/10 GB"
     */
    $scope.renderStorageBar = function() {
        return tools.renderStorageBar(authentication.user.UsedSpace, authentication.user.MaxSpace);
    };

    /**
     * Returns the number of unread messages in a location
     * @param mailbox {String} name indentifier for folder
     * @param id {Integer} labelID for a label
     * @return {Integer}
     */
    $scope.unread = function(mailbox, id) {
        var result;
        var count;

        switch (mailbox) {
            case 'drafts':
                count = cacheCounters.unreadMessage(CONSTANTS.MAILBOX_IDENTIFIERS[mailbox]);
                break;
            case 'label':
                count = cacheCounters.unreadConversation(id);
                break;
            default:
                count = cacheCounters.unreadConversation(CONSTANTS.MAILBOX_IDENTIFIERS[mailbox]);
                break;
        }

        if (count === undefined) {
            // THIS IS A BUG. TODO: WHY IS THIS UNDEFINED!
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
