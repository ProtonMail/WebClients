angular.module("proton.controllers.Wizard", [])

.controller("WizardController", function(
    $scope,
    $rootScope,
    $state,
    $log,
    $translate,
    tools,
    networkActivityTracker
) {
    $scope.pages = [1,2,3];
    $scope.selection = 1;
    $scope.changePage = function(page) {
        console.log(page);
        $scope.selection = page;
    };
});
