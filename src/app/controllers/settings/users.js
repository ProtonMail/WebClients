angular.module("proton.controllers.Settings")

.controller('UsersController', function($rootScope, $scope, userModal) {
    $scope.organization = {
        name: ''
    };
    $scope.users = {};

    $scope.saveOrganizationName = function() {
        // $scope.organization.name;
    };

    $scope.openUserModal = function() {
        userModal.activate({
            params: {
                submit: function(datas) {
                    userModal.deactivate();
                },
                cancel: function() {
                    userModal.deactivate();
                }
            }
        });
    };
});
