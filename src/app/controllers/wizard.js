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
    $scope.selection = 1;
});
