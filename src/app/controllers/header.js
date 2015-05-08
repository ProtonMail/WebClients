angular.module("proton.controllers.Header", [])

.controller("HeaderController", function($scope, $state, $rootScope) {
    $scope.search = function() {
        console.log('search ' + $scope.searchInput);
    };

    $scope.updateSearch = function(input) {
        $rootScope.$broadcast('updateSearch', input.searchInput);
    };

    $scope.onFocus = function() {
        $scope.searchInputFocus = true;
        $scope.go('secured.search');
    };

    $scope.onBlur = function() {
        $scope.searchInputFocus = false;
        $state.go('secured.inbox');
    };

    $scope.openNewMessage = function() {
        $rootScope.$broadcast('newMessage');
    };

    $scope.openSearchModal = function() {
        $rootScope.$broadcast('openSearchModal');
    };

    $scope.openReportModal = function() {
        $rootScope.$broadcast('openReportModal');
    };
});
