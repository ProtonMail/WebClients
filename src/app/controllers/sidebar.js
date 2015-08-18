angular.module("proton.controllers.Sidebar", ["proton.constants"])

.controller('SidebarController', function(
    $scope,
    $rootScope,
    $state,
    $stateParams,
    $http,
    $translate,
    Message,
    authentication,
    messageCounts,
    tools,
    notify,
    CONSTANTS,
    CONFIG,
    $timeout) {
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

    // Listeners
    $scope.$on('updateLabels', function(event) { $scope.updateLabels(); });
    $scope.$on('updateCounters', function(event) { $scope.refreshCounters(); });

    $scope.initialization = function() {
        $scope.refreshCounters();

        $(window).bind('resize', $scope.onResize);

        $scope.$on("$destroy", function() {
            $(window).unbind('resize', $scope.onResize);
        });
    };

    $scope.refreshCounters = function() {
        messageCounts.refresh().then(function() {
            $rootScope.$broadcast('updatePageName');
            $scope.labelScroller();
        });
    };

    $scope.onResize = function() {
        $scope.labelScroller();
    };

    $scope.updateLabels = function () {
        $scope.labels = authentication.user.Labels;
    };

    $scope.spinIcon = function() {
        $scope.spinMe = true;
        $timeout(function() {
            $scope.spinMe = false;
        }, 510);
    };

    // Call event to open new composer
    $scope.compose = function() {
        $rootScope.$broadcast('newMessage');
    };

    $scope.color = function(label) {
        return {
            color: label.Color
        };
    };

    $scope.labelsDisplayed = function() {
        return _.where($scope.labels, {Display: 0});
    };

    $scope.goTo = function(route) {
        var sameFolder = $state.current.name === route;
        var firstPage = $stateParams.page === 1 || angular.isUndefined($stateParams.page);

        $rootScope.$broadcast('goToFolder');
        // I used this instead of ui-sref because ui-sref-options is not synchronized when user click on it.
        if(sameFolder === true && firstPage === true) {
            // Do nothing
            // Chut...
        } else {
            var params = {page: undefined, filter: undefined, sort: undefined};

            $state.go(route, params); // remove the older parameters
        }
    };

    $scope.sizeBar = function() {
        return {
            width: (100 * authentication.user.UsedSpace / authentication.user.MaxSpace) + '%'
        };
    };

    $scope.renderStorageBar = function() {
        return tools.renderStorageBar(authentication.user.UsedSpace, authentication.user.MaxSpace);
    };

    $scope.onDropMessage = function(event, ui, name) {
        var folders = ['inbox', 'archive', 'spam', 'trash'];

        if(_.contains(folders, name)) { // Is it a folder?
            if($state.is('secured.' + name)) { // Same folder?
                notify($translate.instant('SAME_FOLDER'));
            } else {
                $rootScope.$broadcast('moveMessagesTo', name);
            }
        } else if(name === 'starred') {
            // Just star selected messages
            $rootScope.$broadcast('starMessages');
        } else {
            var LabelID = name;
            // Apply label
            $rootScope.$broadcast('applyLabels', LabelID);
        }
    };

    $scope.getUnread = function(mailbox, id) {
        var count = 0;
        var value;
        var counters = messageCounts.get();

        if(mailbox === 'label') {
            value = counters.Labels[id];
        } else if (mailbox === 'starred'){
            value = counters.Starred;
        } else {
            value = counters.Locations[CONSTANTS.MAILBOX_IDENTIFIERS[mailbox]];
        }

        if(angular.isDefined(value)) {
            count = value;
        }

        return count;
    };

    $scope.labelScroller = function() {
        var sidebarWrapHeight = $('#sidebarWrap').outerHeight();
        var sidebarMenuHeight = 0;

        $('#sidebarWrap > .list-group').each( function() {
            sidebarMenuHeight += $(this).outerHeight();
        });

        if (sidebarMenuHeight > 0) {
            $('#sidebarLabels').css('height', (sidebarWrapHeight - sidebarMenuHeight));
        }
    };

    $scope.initialization();
});
