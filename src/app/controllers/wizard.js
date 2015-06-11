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
    $scope.page='templates/views/wizard.start.tpl.html';
    $scope.selection = 1;

    $scope.changePage = function(page) {
        $scope.selection = page;
    };
});
