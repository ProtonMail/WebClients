angular.module("proton.controllers.Search", [])

.controller("SearchController", function($rootScope, $scope, networkActivityTracker) {
    $scope.open = true;

    $scope.params = {};

    $scope.search = function(fromNavbar) {
        console.log('search');
    };

    $scope.open = function() {
        $('#searchForm').modal('show');
        $scope.open = true;
    };

    $scope.close = function() {
        $('#searchForm').modal('hide');
        $scope.open = false;
    };

    $scope.style = function() {
        var display = 'none';

        if($scope.open) {
            display = 'block';
        }

        return {
            display: display
        };
    };

    $rootScope.$on('displayNameChange', function(params) {
        $rootScope.user.displayName = params.displayName;
    });
});
