angular.module("proton.controllers.Settings")

.controller('MembersController', function(
    $rootScope,
    $scope,
    $translate,
    confirmModal,
    Address,
    Member,
    members,
    organization,
    Organization,
    storageModal,
    domains,
    userModal,
    notify
) {
    var MASTER = 2;
    var SUB = 1;
    var NORMAL = 0;

    $scope.roles = [
        {label: $translate.instant('MASTER'), value: MASTER},
        {label: $translate.instant('SUB'), value: SUB}
    ];

    // Listeners
    $scope.$on('organizationChange', function(event, organization) {
        $scope.organization = organization;
    });

    $scope.$on('deleteDomain', function(event, domainId) {
        var index = _.findIndex($scope.domains, {ID: domainId});

        if (index !== -1) {
            $scope.domains.splice(index, 1);
        }
    });

    $scope.$on('createDomain', function(event, domainId, domain) {
        var index = _.findIndex($scope.domains, {ID: domainId});

        if (index === -1) {
            $scope.domains.push(domain);
        } else {
            _.extend($scope.domains[index], domain);
        }
    });

    $scope.$on('updateDomain', function(event, domainId, domain) {
        var index = _.findIndex($scope.domains, {ID: domainId});

        if (index === -1) {
            $scope.domains.push(domain);
        } else {
            _.extend($scope.domains[index], domain);
        }
    });

    $scope.$on('deleteMember', function(event, memberId) {
        var index = _.findIndex($scope.members, {ID: memberId});

        if (index !== -1) {
            $scope.members.splice(index, 1);
        }
    });

    $scope.$on('createMember', function(event, memberId, member) {
        var index = _.findIndex($scope.members, {ID: memberId});

        if (index === -1) {
            $scope.members.push(member);
        } else {
            _.extend($scope.members[index], member);
        }
    });

    $scope.$on('updateMember', function(event, memberId, member) {
        var index = _.findIndex($scope.members, {ID: memberId});

        if (index === -1) {
            $scope.members.push(member);
        } else {
            _.extend($scope.members[index], member);
        }
    });

    $scope.initialization = function() {
        if (organization.data && organization.data.Code === 1000) {
            $scope.organization = organization.data.Organization;
        }

        if (members.data && members.data.Code === 1000) {
            $scope.members = members.data.Members;
        }

        if (domains.data && domains.data.Code === 1000) {
            $scope.domains = domains.data.Domains;
        }
    };

    /**
     * We check if domains are verified
     * @return {Boolean}
     */
    $scope.checkDomains = function() {
        var verified = false;

        if (angular.isArray($scope.domains)) {
            _.each($scope.domains, function(domain) {
                if (domain.State === 1) {
                    verified = true;
                }
            });
        }

        return verified;
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
        Member.role(member.ID, member.Role).then(function(result) { // TODO check request
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
        Organization.update({
            Organization: {
                DisplayName: $scope.organization.DisplayName
            }
        }).then(function(result) { // TODO omit some parameters
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
        var message = $translate.instant('Are you sure you want to unlink this address?');

        confirmModal.activate({
            params: {
                title: title,
                message: message,
                confirm: function() {
                    Address.disable(address.ID).then(function(result) {
                        if (result.data && result.data) {
                            address.Status = 0;
                            confirmModal.deactivate();
                            notify({message: $translate.instant('ADDRESS_DISABLED'), classes: 'notification-success'});
                        }
                    });
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
        // TODO
    };

    /**
     * Generate keys
     * @param {Object} member
     */
    $scope.generateKeys = function(member) {
        // TODO
    };

    /**
     * Open a new tab to access to a specific user's inbox
     * @param {Object} member
     */
    $scope.enterMailbox = function(member) {
        // TODO
    };

    /**
     * Remove member
     * @param {Object} member
     */
    $scope.remove = function(member) {
        var title = $translate.instant('REMOVE_MEMBER');
        var message = $translate.instant('Are you sure you want to remove this user?');
        var index = $scope.members.indexOf(member);

        confirmModal.activate({
            params: {
                title: title,
                message: message,
                confirm: function() {
                    networkActivityTracker.track(Member.delete(member.ID).then(function(result) {
                        if(angular.isDefined(result.data) && result.data.Code === 1000) {
                            $scope.members.splice(index, 1); // Remove member in the members list
                            confirmModal.deactivate(); // Close the modal
                            notify({message: $translate.instant('USER_REMOVED'), classes: 'notification-success'}); // Display notification
                        } else if(angular.isDefined(result.data) && angular.isDefined(result.data.Error)) {
                            notify({message: result.data.Error, classes: 'notification-danger'});
                        } else {
                            notify({message: $translate.instant('ERROR_DURING_DELETION'), classes: 'notification-danger'});
                        }
                    }, function() {
                        notify({message: $translate.instant('ERROR_DURING_DELETION'), classes: 'notification-danger'});
                    }));
                },
                cancel: function() {
                    confirmModal.deactivate();
                }
            }
        });
    };

    /**
     * Open modal to manage member's storage
     * @param {Object} member
     */
    $scope.manageStorage = function(member) {
        storageModal.activate({
            params: {
                member: member,
                organization: $scope.organization,
                submit: function(member) {
                    networkActivityTracker.track(Member.quota(member.ID, member.UsedSpace).then(function(result) {
                        if (result.data && result.data.Code === 1000) {
                            notify({message: $translate.instant('QUOTA_UPDATED'), classes: 'notification-success'});
                            storageModal.deactivate();
                        }
                    }));
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
                organization: $scope.organization,
                domains: $scope.domains,
                submit: function(datas) {
                    // TODO
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
