angular.module("proton.controllers.Search", [])

.controller("SearchController", function($rootScope, $scope, networkActivityTracker) {
    $scope.open = true;

    $scope.search = function() {

    };

    $scope.toggle = function() {
        if($scope.open) {
            $scope.hide();
        } else {
            $scope.show();
        }
    };

    $scope.show = function() {
        $scope.open = true;
    };

    $scope.hide = function() {
        $scope.open = false;
    };

    $scope.close = function() {
        $scope.hide();
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
});
