angular.module("proton.controllers.Settings")

.controller('UsersController', function($rootScope, $scope, userModal) {
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
