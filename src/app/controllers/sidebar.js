angular.module("proton.controllers.Sidebar", [])

.controller('SidebarController', function($scope, $rootScope, $state, $http, $translate, $interval, Message, authentication, tools, notify, CONSTANTS) {
    var mailboxes = CONSTANTS.MAILBOX_IDENTIFIERS;

    $scope.labels = authentication.user.Labels;
    $scope.$on('updateLabels', function(){$scope.updateLabels();});
    $scope.updateLabels = function () {
        $scope.labels = authentication.user.Labels;
    };

    $scope.droppableOptions = {
        accept: '.ui-draggable',
        activeClass: 'drop-active',
        hoverClass: 'drop-hover'
    };

    $scope.droppedMessages = [];
    // Call event to open new composer
    $scope.compose = function() {
        $rootScope.$broadcast('newMessage');
    };

    $scope.labelsDisplayed = function() {
        return _.where($scope.labels, {Display: 0});
    };

    $scope.goTo = function(route) {
        $rootScope.$broadcast('goToFolder');
        // I used this instead of ui-sref because ui-sref-options is not synchronized when user click on it.
        $state.go(route, {page: 1, filter: null, sort: null});
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
            // Apply label and archive
            $rootScope.$broadcast('applyLabels', LabelID);
            $rootScope.$broadcast('moveMessagesTo', 'archive');
        }
    };

    $scope.$on('updateCounters', function(event) {
        $scope.getUnread();
    });

    if (typeof $rootScope.counters === 'undefined') {
        Message.unreaded({}).$promise.then(function(response) {
            $rootScope.counters = response;
        });
    }

    $scope.getUnread = function(mailbox, id) {
        var count = 0;
        var value;

        if(mailbox === 'label') {
            _.forEach($rootScope.counters.Labels, function(label) {
                if (label.LabelID === id) {
                    value = label.Count;
                }
            }) ;
        } else {
            _.forEach($rootScope.counters.Locations, function(location) {
                if (location.Location === CONSTANTS.MAILBOX_IDENTIFIERS[mailbox]) {
                    value = location.Count;
                }
            }) ;
        }

        if(angular.isDefined(value)) {
            count = value;
        }

        return count;
    };

    $scope.$on("$destroy", function() {
        $interval.cancel(updates);
    });
});
