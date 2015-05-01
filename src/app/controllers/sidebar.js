angular.module("proton.controllers.Sidebar", [])

.controller('SidebarController', function($scope, $rootScope, $state) {
    // Call event to open new composer
    $scope.compose = function() {
        // $state.go('secured.compose');
        $rootScope.$broadcast('newMessage');
    };
});
