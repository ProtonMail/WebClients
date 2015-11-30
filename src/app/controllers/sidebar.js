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
    authentication,
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
    $scope.labels = authentication.user.Labels;
    $scope.appVersion = CONFIG.app_version;
    $scope.droppedMessages = [];
    $scope.droppableOptions = {
        accept: '.ui-draggable',
        activeClass: 'drop-active',
        hoverClass: 'drop-hover'
    };

    $scope.hideMobileSidebar = function() {
        $rootScope.$broadcast('sidebarMobileToggle');
    };

    // Listeners
    $scope.$on('updateLabels', function(event) { $scope.updateLabels(); });
    $scope.$on('refreshCounters', function(event) { $scope.refreshCounters(); });
    $scope.$on('createLabel', function(event) { $scope.createLabel(); });

    /**
     * Called at the beginning
     */
    $scope.initialization = function() {
        $scope.refreshCounters();

        $(window).bind('resize', $scope.labelScroller );

        $scope.$on("$destroy", function() {
            $(window).unbind('resize', $scope.labelScroller );
        });
    };

    /**
     * Open modal to create a new label
     */
    $scope.createLabel = function() {
        labelModal.activate({
            params: {
                title: $translate.instant('CREATE_NEW_LABEL'),
                create: function(name, color) {
                    // already exist?
                    var result = _.find(authentication.user.Labels, function(label) {
                        return label.Name === name;
                    });

                    if (angular.isUndefined(result)) {
                        labelModal.deactivate();
                        networkActivityTracker.track(
                            Label.save({
                                Name: name,
                                Color: color,
                                Display: 1
                            }).$promise.then(function(result) {
                                if(angular.isDefined(result.Label)) {
                                    notify({message: $translate.instant('LABEL_CREATED'), classes: 'notification-success'});
                                    authentication.user.Labels.push(result.Label);
                                } else {
                                    notify({message: result.Error, classes: 'notification-danger'});
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
     * Manipulates the DOM (labelScroller), sets unread count, and updates the title of the page
     */
    $scope.refreshCounters = function() {
        $scope.labelScroller();
    };

    $scope.updateLabels = function () {
        $scope.labels = authentication.user.Labels;
    };

    /**
     * Animates the inbox refresh icon
     */
    $scope.spinIcon = function() {
        $scope.spinMe = true;
        $timeout(function() {
            $scope.spinMe = false;
        }, 510);
    };

    /**
     * Send request to get the last event
     */
    $scope.lastEvent = function() {
        $scope.spinIcon();
        eventManager.call();
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

        $scope.hideMobileSidebar();

        // I used this instead of ui-sref because ui-sref-options is not synchronized when user click on it.
        if(sameFolder === true && firstPage === true) {
            $scope.lastEvent();
        } else {
            var params = {page: undefined, filter: undefined, sort: undefined};

            $state.go(route, params); // remove the older parameters
        }
    };

    /**
     * Open label folder
     * @param {Object} label
     */
    $scope.goToLabel = function(label) {
        var params = {page: undefined, filter: undefined, sort: undefined, label: label.ID};

        $state.go('secured.label.list', params);
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
            case 'sent':
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

    /**
     * Manipulates the DOM height for the scrollable labels area
     * TODO: Should be a directive? This needs to be fixed in v3.
     */
    $scope.labelScroller = function() {

        $('#sidebarLabels').css('height', 'auto');

        var sidebarWrapHeight = $('#sidebarWrap').outerHeight();
        var sidebarMenuHeight = 0;
        var height;

        $('#sidebarWrap > .list-group').each( function() {
            sidebarMenuHeight += $(this).outerHeight();
        });

        if (sidebarMenuHeight > 0) {
            height = (sidebarWrapHeight - sidebarMenuHeight);
        }

        if ($('.storage').is(':visible')) {
            height -= $('.storage').outerHeight();
        }

        $('#sidebarLabels').css('height', height);

    };

    $scope.initialization();
});
