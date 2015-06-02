angular.module("proton.controllers.Header", [])

.controller("HeaderController", function($scope, $state, $stateParams, $rootScope) {
    $scope.params = {
        searchInput: $stateParams.words || ''
    };

    $scope.search = function() {
        if($scope.params.searchInput.length > 0) {
            $rootScope.$broadcast('search', $scope.params.searchInput);
        } else {
            $state.go('secured.inbox');
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

    $scope.onBlurSearch = function() {
        if($scope.params.searchInput.length === 0) {
            $scope.searchInputFocus = false;
        }
    };

    $scope.onFocusSearch = function() {
        $scope.searchInputFocus = true;
    };
});
