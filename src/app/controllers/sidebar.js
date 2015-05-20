angular.module("proton.controllers.Sidebar", [])

.controller('SidebarController', function($scope, $rootScope, $state, authentication) {
    // Call event to open new composer
    $scope.compose = function() {
        $rootScope.$broadcast('newMessage');
    };

    $scope.labels = authentication.user.labels;

    $scope.labelsDisplayed = function() {
        return _.where($scope.labels, {Display: 0});
    };

    $scope.goTo = function(route) {
        // I used this instead of ui-sref because ui-sref-options is not synchronized when user click on it.
        $state.go(route, {}, {reload: $state.is(route)});
    };
});
