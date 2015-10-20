angular.module("proton.controllers.Settings")

.controller('UsersController', function($rootScope, $scope, $translate, userModal) {
    var MASTER = 0;
    var SUB = 1;

    $scope.selectExample = 'toto';
    $scope.optionsExample = ['qwe', 'asd', 'zxc'];
    $scope.roles = [
        {label: $translate.instant('MASTER'), value: MASTER},
        {label: $translate.instant('SUB'), value: SUB}
    ];
    $scope.organization = {
        name: ''
    };

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
        },
        {
            id: 2,
            username: 'default@emailaddresses.com',
            role: SUB,
            storage: 123,
            addresses: [
                {
                    id: 2,
                    address: 'qweqweqwe@qweqwe.fr',
                    default: true
                }
            ]
        }
    ];

    /**
     * Initialize select value with role user
     */
    $scope.initRole = function(user) {
        var role = _.findWhere($scope.roles, {value: user.role});

        if(angular.isDefined(role)) {
            user.selectRole = role;
        }
    };

    /**
     * Inform the back-end to change user role
     */
    $scope.changeRole = function(user) {
        console.log('changeRole', user);
    };

    /**
     * Save the organization name
     */
    $scope.saveOrganizationName = function() {
        // $scope.organization.name;
    };

    /**
     * Unlink address
     */
    $scope.unlinkAddress = function(user, address) {

    };

    /**
     * Manage user's passwords
     */
    $scope.managePasswords = function(user) {

    };

    /**
     * Generate keys
     */
    $scope.generateKeys = function(user) {

    };

    /**
     * Open a new tab to access to a specific user's inbox
     */
    $scope.enterMailbox = function(user) {

    };

    /**
     * Provide a modal to create a new user
     */
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
