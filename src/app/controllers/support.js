angular.module("proton.controllers.Contacts", [])

.controller("SupportController", function($scope) {
    $scope.params = {};
    $scope.params.recoveryEmail = '';
    $scope.params.username = '';

    $scope.resetPassword = function() {
        // feng prepare methods to reset password
    };
});
