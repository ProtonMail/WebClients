angular.module("proton.controllers.Header", [])

.controller("HeaderController", function($scope, $rootScope) {
    $scope.search = function() {
        console.log('search ' + $scope.searchInput);
    };

    $scope.openSearchModal = function() {
        $rootScope.$broadcast('openSearchModal');
    };

    $scope.openReportModal = function() {
        $rootScope.$broadcast('openReportModal');
    };
});
