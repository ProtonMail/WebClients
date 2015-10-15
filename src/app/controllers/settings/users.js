angular.module("proton.controllers.Settings")

.controller('UsersController', function($rootScope, $scope, $translate, userModal) {
    var MASTER = 0;
    var SUB = 1;

    $scope.organization = {
        name: ''
    };

    $scope.roles = [MASTER, SUB];

    // Example
    $scope.users = [
        {
            id: 1,
            username: 'default@emailaddresses.com',
            role: MASTER,
            storage: 123,
            addresses: [
                {
                    id: 1,
                    address: 'qweqweqwe@qweqwe.fr',
                    default: true
                }
            ]
        }
    ];

    $scope.saveOrganizationName = function() {
        // $scope.organization.name;
    };

    $scope.unlinkAddress = function(user, address) {

    };

    $scope.managePasswords = function(user) {

    };

    $scope.generateKeys = function(user) {

    };

    $scope.enterMailbox = function(user) {

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
