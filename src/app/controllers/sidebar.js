angular.module("proton.controllers.Sidebar", ["proton.constants"])

.controller('SidebarController', function(
    $scope,
    $rootScope,
    $state,
    $stateParams,
    $http,
    $translate,
    $interval,
    Message,
    authentication,
    messageCounts,
    tools,
    notify,
    CONSTANTS,
    CONFIG,
    $timeout) {
    var mailboxes = CONSTANTS.MAILBOX_IDENTIFIERS;

    $scope.labels = authentication.user.Labels;
    $scope.$on('updateLabels', function(){$scope.updateLabels();});
    $scope.updateLabels = function () {
        $scope.labels = authentication.user.Labels;
    };

    $scope.appVersion = CONFIG.app_version;

    $scope.droppableOptions = {
        accept: '.ui-draggable',
        activeClass: 'drop-active',
        hoverClass: 'drop-hover'
    };

    $scope.spinIcon = function() {
        $scope.spinMe = true;
        $timeout(function() {
            $scope.spinMe = false;
        }, 510);
    };

    $scope.droppedMessages = [];
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

    $scope.counters = function() {
        return messageCounts.get();
    };

    $scope.$on('updateCounters', function(event) {
        messageCounts.refresh();
    });

    $timeout(function() {
        messageCounts.refresh();
    });

    $scope.getUnread = function(mailbox, id) {
        var count = 0;
        var value;
        var counters = $scope.counters();

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
});
