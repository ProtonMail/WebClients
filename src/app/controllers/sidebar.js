angular.module("proton.controllers.Sidebar", [])

.controller('SidebarController', function($scope, $rootScope, $state, authentication) {
    // Call event to open new composer
    $scope.compose = function() {
        $rootScope.$broadcast('newMessage');
    };

    $scope.labels = authentication.user.labels;

    $scope.labelsDisplayed = function() {
        return _.where($scope.labels, {Display: 1});
    };
});
