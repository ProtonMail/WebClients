angular.module("proton.controllers.Header", [])

.controller("HeaderController", function($scope, $state, $rootScope) {
    $scope.params = {
        searchInput: ''
    };

    $scope.search = function() {
        if($scope.params.searchInput.length > 0) {
            $rootScope.$broadcast('search', $scope.params.searchInput);
        }
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
