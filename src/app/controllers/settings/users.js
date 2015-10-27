angular.module("proton.controllers.Settings")

.controller('UsersController', function($rootScope, $scope, $translate, confirmModal, userModal, group, members, addresses) {
    var MASTER = 0;
    var SUB = 1;

    $scope.group = group.Group;
    $scope.members = members.Members;
    $scope.addresses = addresses.Addresses;
    $scope.selectExample = 'toto';
    $scope.optionsExample = ['qwe', 'asd', 'zxc'];
    $scope.roles = [
        {label: $translate.instant('MASTER'), value: MASTER},
        {label: $translate.instant('SUB'), value: SUB}
    ];
    $scope.organization = {
        name: ''
    };

    $scope.addressesOf = function(member) {
        var addresses = [];

        _.each(member.AddressIDs, function(addressID) {
            var address = _.findWhere($scope.addresses, {AddressID: addressID});

            if(angular.isDefined(address)) {
                addresses.push(address);
            }
        });

        return addresses;
    };

    /**
     * Initialize select value with role user
     */
    $scope.initRole = function(user) {
        var role = _.findWhere($scope.roles, {value: user.Role});

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
        var title = $translate.instant('UNLINK_ADDRESS');
        var message = 'Are you sure you want to unlink this address?'; // TODO translate

        confirmModal.activate({
            params: {
                title: title,
                message: message,
                confirm: function() {
                    // TODO
                    confirmModal.deactivate();
                },
                cancel: function() {
                    confirmModal.deactivate();
                }
            }
        });
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
