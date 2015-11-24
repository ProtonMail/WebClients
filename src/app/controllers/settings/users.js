angular.module("proton.controllers.Settings")

.controller('UsersController', function(
    $rootScope,
    $scope,
    $translate,
    confirmModal,
    Member,
    members,
    organization,
    Organization,
    storageModal,
    userModal
) {
    var MASTER = 0;
    var SUB = 1;

    $scope.roles = [
        {label: $translate.instant('MASTER'), value: MASTER},
        {label: $translate.instant('SUB'), value: SUB}
    ];

    $scope.initialization = function() {
        console.log(organization);
        console.log(members);
        $scope.organization = organization.Organization;
        $scope.members = members.Members;
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
    $scope.initRole = function(member) {
        var role = _.findWhere($scope.roles, {value: member.Role});

        if(angular.isDefined(role)) {
            member.selectRole = role;
        }
    };

    /**
     * Inform the back-end to change member role
     * @param {Object} member
     */
    $scope.changeRole = function(member) {
        Member.update(member).then(function(result) { // TODO check request
            if(result.data && result.data.Code === 1000) {
                notify({message: $translate.instant('ROLE_UPDATED'), classes: 'notification-success'});
            } else if(result.data && result.data.Error) {
                notify({message: result.data.Error, classes: 'notification-danger'});
            } else {
                notify({message: $translate.instant('ERROR_DURING_UPDATING'), classes: 'notification-danger'});
            }
        }, function(error) {
            notify({message: $translate.instant('ERROR_DURING_UPDATING'), classes: 'notification-danger'});
        });
    };

    /**
     * Save the organization name
     */
    $scope.saveOrganizationName = function() {
        Organization.update($scope.organization).then(function(result) { // TODO omit some parameters
            if(result.data && result.data.Code === 1000) {
                notify({message: $translate.instant('ORGANIZATION_UPDATED'), classes: 'notification-success'});
            } else if(result.data && result.data.Error) {
                notify({message: result.data.Error, classes: 'notification-danger'});
            } else {
                notify({message: $translate.instant('ERROR_DURING_UPDATING'), classes: 'notification-danger'});
            }
        }, function(error) {
            notify({message: $translate.instant('ERROR_DURING_UPDATING'), classes: 'notification-danger'});
        });
    };

    /**
     * Unlink address
     * @param {Object} member
     * @param {Object} address
     */
    $scope.unlinkAddress = function(member, address) {
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
     * @param {Object} member
     */
    $scope.managePasswords = function(member) {

    };

    /**
     * Generate keys
     * @param {Object} member
     */
    $scope.generateKeys = function(member) {

    };

    /**
     * Open a new tab to access to a specific user's inbox
     * @param {Object} member
     */
    $scope.enterMailbox = function(member) {

    };

    /**
     * Open modal to manage member's storage
     * @param {Object} member
     */
    $scope.manageStorage = function(member) {
        storageModal.activate({
            params: {
                member: member,
                submit: function() {
                    storageModal.deactivate();
                },
                cancel: function() {
                    storageModal.deactivate();
                }
            }
        });
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

    // Call initialization
    $scope.initialization();
});
