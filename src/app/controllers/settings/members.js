angular.module('proton.controllers.Settings')

.controller('MembersController', (
    $rootScope,
    $scope,
    $state,
    $stateParams,
    Address,
    authentication,
    confirmModal,
    domains,
    eventManager,
    gettextCatalog,
    Member,
    memberModal,
    members,
    networkActivityTracker,
    notify,
    organization,
    Organization,
    organizationKeys,
    storageModal,
    generateModal
) => {
    const MASTER = 2;
    const SUB = 1;

    $scope.roles = [
        { label: gettextCatalog.getString('Master', null), value: MASTER },
        { label: gettextCatalog.getString('Sub', null), value: SUB }
    ];

    // Listeners
    $scope.$on('deleteDomain', (event, domainId) => {
        const index = _.findIndex($scope.domains, { ID: domainId });

        if (index !== -1) {
            $scope.domains.splice(index, 1);
        }
    });

    $scope.$on('createDomain', (event, domainId, domain) => {
        const index = _.findIndex($scope.domains, { ID: domainId });

        if (index === -1) {
            $scope.domains.push(domain);
        } else {
            _.extend($scope.domains[index], domain);
        }
    });

    $scope.$on('updateDomain', (event, domainId, domain) => {
        const index = _.findIndex($scope.domains, { ID: domainId });

        if (index === -1) {
            $scope.domains.push(domain);
        } else {
            _.extend($scope.domains[index], domain);
        }
    });

    $rootScope.$on('deleteMember', (event, memberId) => {
        const index = _.findIndex($scope.members, { ID: memberId });

        if (index !== -1) {
            $scope.members.splice(index, 1);
        }
    });

    $rootScope.$on('createMember', (event, memberId, member) => {
        const index = _.findIndex($scope.members, { ID: memberId });

        if (index === -1) {
            $scope.members.push(member);
        } else {
            _.extend($scope.members[index], member);
        }
    });

    $rootScope.$on('updateMember', (event, memberId, member) => {
        const index = _.findIndex($scope.members, { ID: memberId });
        if (index === -1) {
            $scope.members.push(member);
        } else {
            _.extend($scope.members[index], member);
        }
    });

    $scope.initialization = function () {
        if (members.data && members.data.Code === 1000) {
            $scope.members = members.data.Members;
        }

        if (domains.data && domains.data.Code === 1000) {
            $scope.domains = domains.data.Domains;
        }

        if (organization.data && organization.data.Code === 1000) {
            $scope.organization = organization.data.Organization;
        }

        if (organizationKeys.data && organizationKeys.data.Code === 1000) {
            $scope.organizationPublicKey = organizationKeys.data.PublicKey;
            $scope.organizationPrivateKey = organizationKeys.data.PrivateKey;
        }

        switch ($stateParams.action) {
            case 'new':
                $scope.add();
                break;
            case 'edit':
                $scope.edit(_.findWhere($scope.members, { ID: $stateParams.id }));
                break;
            default:
                break;
        }
    };

    /**
     * We check if domains are verified
     * @return {Boolean}
     */
    $scope.checkDomains = function () {
        let verified = false;

        if (angular.isArray($scope.domains)) {
            _.each($scope.domains, (domain) => {
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
    $scope.initRole = function (member) {
        const role = _.findWhere($scope.roles, { value: member.Role });

        if (angular.isDefined(role)) {
            member.selectRole = role;
        }
    };

    /**
     * Inform the back-end to change member role
     * @param {Object} member
     */
    $scope.changeRole = function (member) {
        const params = { Role: member.selectRole.value };

        // THIS IS WRONG
        if (true) {
            throw new Error('this is wrong!');
        }

        if (member.selectRole.value === MASTER) {
            params.PrivateKey = $scope.organizationPrivateKey;
        }

        Member.role(member.ID, params).then((result) => { // TODO check request
            if (result.data && result.data.Code === 1000) {
                notify({ message: gettextCatalog.getString('Role updated', null), classes: 'notification-success' });
            } else if (result.data && result.data.Error) {
                notify({ message: result.data.Error, classes: 'notification-danger' });
            } else {
                notify({ message: gettextCatalog.getString('Error during updating', null, 'Error'), classes: 'notification-danger' });
            }
        }, () => {
            notify({ message: gettextCatalog.getString('Error during updating', null, 'Error'), classes: 'notification-danger' });
        });
    };

    /**
     * Save the organization name
     */
    $scope.saveOrganizationName = function () {
        Organization.update({ DisplayName: $scope.organization.DisplayName })
        .then((result) => {
            if (result.data && result.data.Code === 1000) {
                notify({ message: gettextCatalog.getString('Organization updated', null), classes: 'notification-success' });
            } else if (result.data && result.data.Error) {
                notify({ message: result.data.Error, classes: 'notification-danger' });

            } else {
                notify({ message: gettextCatalog.getString('Error during updating', null, 'Error'), classes: 'notification-danger' });
            }
        }, () => {
            notify({ message: gettextCatalog.getString('Error during updating', null, 'Error'), classes: 'notification-danger' });
        });
    };

    /**
     * Unlink address
     * @param {Object} member
     * @param {Object} address
     */
    $scope.unlinkAddress = function (member, address) {
        const title = gettextCatalog.getString('Unlink address', null, 'Title');
        const message = gettextCatalog.getString('Are you sure you want to unlink this address?', null, 'Info');

        confirmModal.activate({
            params: {
                title,
                message,
                confirm() {
                    Address.disable(address.ID).then((result) => {
                        if (result.data && result.data) {
                            address.Status = 0;
                            confirmModal.deactivate();
                            notify({ message: gettextCatalog.getString('Address disabled', null, 'Info'), classes: 'notification-success' });
                        }
                    });
                },
                cancel() {
                    confirmModal.deactivate();
                }
            }
        });
    };

    /**
     * Open modal to fix keys
     * @param {Object} address
     */
    $scope.generate = function (address) {
        const title = gettextCatalog.getString('Generate key pair', null, 'Title');
        const message = gettextCatalog.getString('Generate key pair', null, 'Info');

        generateModal.activate({
            params: {
                title,
                message,
                addresses: [address],
                password: authentication.getPassword(),
                close(success) {
                    if (success) {
                        eventManager.call();
                    }

                    generateModal.deactivate();
                }
            }
        });
    };

    /**
     * Switch a specific member to private
     * @param {Object} member
     */
    $scope.makePrivate = function (member) {
        var title = gettextCatalog.getString('Privatize Member', null);
        var message = gettextCatalog.getString("Organization administrators will no longer be able to log in and control the member's account after privatization. This change is PERMANENT.", null);
        var success = gettextCatalog.getString('Status Updated', null);

        confirmModal.activate({
            params: {
                title,
                message,
                confirm() {
                    networkActivityTracker.track(
                        Member.privatize(member.ID)
                        .then(function(result) {
                            if (result.data && result.data.Code === 1000) {
                                member.Private = 1;
                                notify({ message: success, classes: 'notification-success' });
                                confirmModal.deactivate();
                            } else if (result.data && result.data.Error) {
                                notify({ message: result.data.Error, classes: 'notification-danger' });
                            }
                        })
                    );
                },
                cancel() {
                    confirmModal.deactivate();
                }
            }
        });
    };

    /**
     * Allow the current user to access to the mailbox of a specific member
     * @param {Object} member
     */
    $scope.readMail = function(member) {
        // This is totally broken
        var mailboxPassword = authentication.getPassword();

        Member.authenticate(member.ID, {broken: 'broken'})
        .then(function(result) {
            if (result.data && result.data.Code === 1000) {
                const sessionToken = result.data.SessionToken;
                const url = window.location.href;
                const arr = url.split('/');
                const domain = arr[0] + '//' + arr[2];
                const tab = $state.href('login', { sub: true }, { absolute: true });
                const send = function (event) {
                    if (event.origin !== domain) { return; }
                    if (event.data === 'ready') {
                        // Send the session token and the organization owner’s mailbox password to the target URI
                        event.source.postMessage({ SessionToken: sessionToken, MailboxPassword: mailboxPassword }, domain);
                        window.removeEventListener('message', send);
                    }
                };
                // Listen message from the future child
                window.addEventListener('message', send, false);
                // Open new tab
                window.open(tab, '_blank');
            } else if (result.data && result.data.Error) {
                notify({ message: result.data.Error, classes: 'notification-danger' });
            }
        });

    };

    /**
     * Open a modal to create a new member
     */
    $scope.add = function () {
        if ($scope.organization.MaxMembers - $scope.organization.UsedMembers < 1) {
            notify({message: gettextCatalog.getString('You have used all members in your plan. Please upgrade your plan to add a new member', null, 'Error'), classes: 'notification-danger'});
            return;
        }

        if ($scope.organization.MaxAddresss - $scope.organization.UsedAddresses < 1) {
            notify({message: gettextCatalog.getString('You have used all addresses in your plan. Please upgrade your plan to add a new member', null, 'Error'), classes: 'notification-danger'});
            return;
        }

        if ($scope.organization.MaxSpace - $scope.organization.UsedSpace < 1) {
            notify({message: gettextCatalog.getString('All storage space has been allocated. Please reduce storage allocated to other members', null, 'Error'), classes: 'notification-danger'});
            return;
        }

        $scope.edit();
    };

    /**
     * Display a modal to edit a member
     * @param {Object} member
     */
    $scope.edit = function (member) {
        memberModal.activate({
            params: {
                member,
                organization: $scope.organization,
                organizationPublicKey: $scope.organizationPublicKey,
                domains: $scope.domains,
                cancel(member) {
                    if (angular.isDefined(member)) {
                        var index = _.findIndex($scope.members, {ID: member.ID});

                        if (index === -1) {
                            $scope.members.push(member);
                        } else {
                            _.extend($scope.members[index], member);
                        }
                    }

                    memberModal.deactivate();
                }
            }
        });
    };

    /**
     * Remove member
     * @param {Object} member
     */
    $scope.remove = function (member) {
        const title = gettextCatalog.getString('Remove member', null, 'Title');
        const message = gettextCatalog.getString('Are you sure you want to remove this member?', null, 'Info');
        const index = $scope.members.indexOf(member);

        confirmModal.activate({
            params: {
                title,
                message,
                confirm() {
                    networkActivityTracker.track(Member.delete(member.ID).then((result) => {
                        if (angular.isDefined(result.data) && result.data.Code === 1000) {
                            $scope.members.splice(index, 1); // Remove member in the members list
                            $scope.organization.UsedMembers--;
                            confirmModal.deactivate(); // Close the modal
                            notify({ message: gettextCatalog.getString('Member removed', null), classes: 'notification-success' }); // Display notification
                        } else if (angular.isDefined(result.data) && angular.isDefined(result.data.Error)) {
                            notify({ message: result.data.Error, classes: 'notification-danger' });
                        } else {
                            notify({ message: gettextCatalog.getString('Error during deletion', null, 'Error'), classes: 'notification-danger' });
                        }
                    }, () => {
                        notify({ message: gettextCatalog.getString('Error during deletion', null, 'Error'), classes: 'notification-danger' });
                    }));
                },
                cancel() {
                    confirmModal.deactivate();
                }
            }
        });
    };

    /**
     * Open modal to manage member's storage
     * @param {Object} member
     */
    $scope.manageStorage = function (member) {
        storageModal.activate({
            params: {
                member,
                organization: $scope.organization,
                submit(space) {
                    networkActivityTracker.track(Member.quota(member.ID, space).then((result) => {
                        if (result.data && result.data.Code === 1000) {
                            eventManager.call();
                            storageModal.deactivate();
                            notify({ message: gettextCatalog.getString('Quota updated', null), classes: 'notification-success' });
                        } else if (result.data && result.data.Error) {
                            notify({ message: result.data.Error, classes: 'notification-danger' });
                        } else {
                            notify({ message: gettextCatalog.getString('Unable to save your changes, please try again.', null, 'Error'), classes: 'notification-danger' });
                        }
                    }, () => {
                        notify({ message: gettextCatalog.getString('Unable to save your changes, please try again.', null, 'Error'), classes: 'notification-danger' });
                    }));
                },
                cancel() {
                    storageModal.deactivate();
                }
            }
        });
    };

    // Call initialization
    $scope.initialization();
});
