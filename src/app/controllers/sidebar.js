angular.module("proton.controllers.Sidebar", [])

.controller('SidebarController', function($scope, $rootScope, $state, $http, $translate, $interval, authentication, tools, notify, CONSTANTS) {
    var mailboxes = CONSTANTS.MAILBOX_IDENTIFIERS;

    $scope.labels = authentication.user.labels;
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
        $state.go(route, {}, {reload: $state.is(route)});
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
        }
    };

    $rootScope.$on('updateCounters', function(event) {
        $scope.updateCounters();
    });

    $scope.updateCounters = function() {
        $rootScope.unreadCount = $rootScope.unreadCount || {};
        $rootScope.total = $rootScope.total || {};

        $http.get(authentication.baseURL + "/messages/count?Location=" + mailboxes.inbox).then(function(resp) {
            $rootScope.messageCount.inbox = resp.data.MessageCount;
        });

        $http.get(authentication.baseURL + "/messages/count?Location=" + mailboxes.drafts).then(function(resp) {
            $rootScope.messageCount.drafts = resp.data.MessageCount;
        });
    };

    var updates = $interval($scope.updateCounters, CONSTANTS.COUNT_UNREAD_INTERVAL_TIME);

    $scope.updateCounters();

    $scope.$on("$destroy", function() {
        $interval.cancel(updates);
    });
});
