angular.module("proton.controllers.Outside", [
    "proton.routes",
    "proton.constants"
])

.controller("OutsideController", function(
    $rootScope,
    $scope,
    $state,
    $stateParams,
    authentication,
    CONSTANTS,
    networkActivityTracker
) {
    $scope.unlock = function() {
        $state.go('eo.message');
    };

    $scope.reply = function() {
        $state.go('eo.reply');
    };

    $scope.send = function() {
        
    };

});
