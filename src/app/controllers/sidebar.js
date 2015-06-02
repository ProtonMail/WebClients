angular.module("proton.controllers.Sidebar", [])

.controller('SidebarController', function($scope, $rootScope, $state, $translate, authentication, tools, notify) {
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
        // I used this instead of ui-sref because ui-sref-options is not synchronized when user click on it.
        $state.go(route, {}, {reload: $state.is(route)});
    };

    $scope.renderStorageBar = function() {
        return tools.renderStorageBar(authentication.user.UsedSpace, authentication.user.MaxSpace);
    };

    $scope.onDropMessage = function(event, ui, name) {
        var folders = ['inbox', 'drafts', 'sent', 'starred', 'archive', 'spam', 'trash'];

        // Is it a folder or a label?
        if(_.contains(folders, name)) {
            if($state.is('secured.' + name)) {
                notify($translate.instant('SAME_FOLDER'));
            } else {
                $rootScope.$broadcast('moveMessagesTo', name);
            }
        } else {
            var LabelID = name;

            $rootScope.$broadcast('applyLabels', LabelID);
        }
    };
});
