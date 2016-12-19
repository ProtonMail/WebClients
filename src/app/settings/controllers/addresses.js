angular.module('proton.settings')
.controller('AddressesController', (
    $q,
    $rootScope,
    $scope,
    $state,
    gettextCatalog,
    Address,
    activateOrganizationModal,
    addressModal,
    authentication,
    domains,
    confirmModal,
    identityModal,
    CONSTANTS,
    Domain,
    eventManager,
    generateModal,
    generateOrganizationModal,
    memberModal,
    members,
    Member,
    networkActivityTracker,
    notify,
    organization,
    organizationKeys,
    pmcw
) => {

    function addressesInit() {
        $scope.activeAddresses = _.where(authentication.user.Addresses, { Status: 1, Receive: 1 });
        $scope.disabledAddresses = _.difference(authentication.user.Addresses, $scope.activeAddresses);
        $scope.itemMoved = false;
        $scope.keyStatus = 0;

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

            pmcw.keyInfo(organizationKeys.data.PublicKey)
            .then((obj) => {
                $scope.organizationKeyInfo = obj;
            });

            if (!organizationKeys.data.PrivateKey) {
                $scope.keyStatus = 1;
            } else {
                pmcw.decryptPrivateKey(organizationKeys.data.PrivateKey, authentication.getPassword())
                .then((key) => {
                    $scope.organizationKey = key;
                }, (error) => {
                    $scope.keyStatus = 2;
                    console.error(error);
                });
            }
        }

        if (CONSTANTS.KEY_PHASE > 3 && $scope.keyStatus > 0) {
            $scope.activateOrganizationKeys();
        }
    }

    const role = authentication.user.Role;

    $scope.getSelf = () => {
        if ($scope.members) {
            return $scope.members.filter((member) => member.Self)[0];
        }
    };

    $scope.canAddAddress = () => {
        if ($scope.organization.MaxAddresses - $scope.organization.UsedAddresses < 1) {
            notify({ message: gettextCatalog.getString('You have used all addresses in your plan. Please upgrade your plan to add a new address', null, 'Error'), classes: 'notification-danger' });
            return 0;
        }

        if ($scope.keyStatus > 0 && CONSTANTS.KEY_PHASE > 3) {
            notify({ message: gettextCatalog.getString('Administrator privileges must be activated', null, 'Error'), classes: 'notification-danger' });
            $state.go('secured.members');
            return;
        }

        return 1;
    };

    $scope.canAddMember = () => {

        if ($scope.organization.MaxMembers === 1 && CONSTANTS.KEY_PHASE > 3) {
            $state.go('secured.members');
            return 0;
        }

        if ($scope.organization.MaxMembers - $scope.organization.UsedMembers < 1) {
            notify({ message: gettextCatalog.getString('You have used all members in your plan. Please upgrade your plan to add a new member', null, 'Error'), classes: 'notification-danger' });
            return 0;
        }

        if ($scope.organization.MaxAddresses - $scope.organization.UsedAddresses < 1) {
            notify({ message: gettextCatalog.getString('You have used all addresses in your plan. Please upgrade your plan to add a new member', null, 'Error'), classes: 'notification-danger' });
            return 0;
        }

        if ($scope.organization.MaxSpace - $scope.organization.UsedSpace < 1) {
            notify({ message: gettextCatalog.getString('All storage space has been allocated. Please reduce storage allocated to other members', null, 'Error'), classes: 'notification-danger' });
            return 0;
        }

        if ($scope.keyStatus > 0 && CONSTANTS.KEY_PHASE > 3) {
            notify({ message: gettextCatalog.getString('Administrator privileges must be activated', null, 'Error'), classes: 'notification-danger' });
            $state.go('secured.members');
            return;
        }

        return 1;
    };

    // Listeners
    if (role === 2) {
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

        $scope.$on('deleteMember', (event, memberId) => {
            const index = _.findIndex($scope.members, { ID: memberId });

            if (index !== -1) {
                $scope.members.splice(index, 1);
            }
        });

        $scope.$on('createMember', (event, memberId, member) => {
            const index = _.findIndex($scope.members, { ID: memberId });

            if (index === -1) {
                $scope.members.push(member);
            } else {
                _.extend($scope.members[index], member);
            }
        });

        $scope.$on('updateMember', (event, memberId, member) => {
            const index = _.findIndex($scope.members, { ID: memberId });

            if (index === -1) {
                $scope.members.push(member);
            } else {
                _.extend($scope.members[index], member);
            }
        });

        $scope.$on('organizationChange', (event, organization) => {
            $scope.organization = organization;
        });
    }

    // Drag and Drop configuration
    $scope.aliasDragControlListeners = {
        containment: '.pm_form',
        accept(sourceItemHandleScope, destSortableScope) {
            return sourceItemHandleScope.itemScope.sortableScope.$id === destSortableScope.$id;
        },
        dragStart() {
            $scope.itemMoved = true;
        },
        dragEnd() {
            $scope.itemMoved = false;
        },
        orderChanged() {
            const addresses = $scope.activeAddresses.concat($scope.disabledAddresses);
            const order = [];

            _.each(addresses, (address, index) => {
                order[index] = address.Send;
                address.Send = index + 1;
            });

            $scope.saveOrder(order);
        }
    };

    // Listeners
    $scope.$on('updateUser', () => {
        if ($scope.itemMoved === false) {
            $scope.activeAddresses = _.where(authentication.user.Addresses, { Status: 1, Receive: 1 });
            $scope.disabledAddresses = _.difference(authentication.user.Addresses, $scope.activeAddresses);
        }

        if (authentication.user.Role !== role) {
            $state.go('secured.addresses');
        }
    });

    // $scope.$on('createUser', () => {
    //     notify({ message: gettextCatalog.getString('Address created', null, 'Info'), classes: 'notification-success' });
    // });

    /**
     * Return domain value for a specific address
     * @param {Object} address
     * @return {String} domain
     */
    $scope.getDomain = (address) => {
        const email = address.Email.split('@');

        return email[1];
    };

    /**
     * Delete address
     * @param {Object} address
     * @param {Object} domain
     */
    $scope.deleteAddress = (address = {}, domain = {}) => {

        confirmModal.activate({
            params: {
                title: gettextCatalog.getString('Delete address', null, 'Title'),
                message: gettextCatalog.getString('Are you sure you want to delete this address?', null, 'Info'),
                confirm() {
                    networkActivityTracker.track(Address.delete(address.ID).then((result) => {
                        if (angular.isDefined(result.data) && result.data.Code === 1000) {
                            notify({ message: gettextCatalog.getString('Address deleted', null, 'Info'), classes: 'notification-success' });

                            if (domain.Addresses) {
                                const index = domain.Addresses.indexOf(address);
                                if (index !== -1) {
                                    domain.Addresses.splice(index, 1); // Remove address in domains UI
                                }
                            }

                            if ($scope.disabledAddresses) {
                                const index = $scope.disabledAddresses.indexOf(address);
                                if (index !== -1) {
                                    $scope.disabledAddresses.splice(index, 1); // Remove address in addresses UI
                                }
                            }

                            eventManager.call(); // Call event log manager
                            confirmModal.deactivate();
                        } else if (angular.isDefined(result.data) && result.data.Error) {
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
     * Enable an address
     */
    $scope.enableAddress = (address) => {
        networkActivityTracker.track(Address.enable(address.ID).then((result) => {
            if (angular.isDefined(result.data) && result.data.Code === 1000) {
                eventManager.call();
                address.Status = 1;
                notify({ message: gettextCatalog.getString('Address enabled', null, 'Info'), classes: 'notification-success' });
            } else if (angular.isDefined(result.data) && result.data.Error) {
                notify({ message: result.data.Error, classes: 'notification-danger' });
            } else {
                notify({ message: gettextCatalog.getString('Error during enable request', null, 'Error'), classes: 'notification-danger' });
            }
        }, () => {
            notify({ message: gettextCatalog.getString('Error during enable request', null, 'Error'), classes: 'notification-danger' });
        }));
    };

    /**
     * Open a modal to disable an address
     */
    $scope.disableAddress = (address) => {
        confirmModal.activate({
            params: {
                title: gettextCatalog.getString('Disable address', null, 'Title'),
                message: gettextCatalog.getString('Are you sure you want to disable this address?', null, 'Info'),
                confirm() {
                    networkActivityTracker.track(Address.disable(address.ID).then((result) => {
                        if (angular.isDefined(result.data) && result.data.Code === 1000) {
                            eventManager.call();
                            address.Status = 0;
                            notify({ message: gettextCatalog.getString('Address disabled', null, 'Info'), classes: 'notification-success' });
                            confirmModal.deactivate();
                        } else if (angular.isDefined(result.data) && result.data.Error) {
                            notify({ message: result.data.Error, classes: 'notification-danger' });
                        } else {
                            notify({ message: gettextCatalog.getString('Error during disable request', null, 'Error'), classes: 'notification-danger' });
                        }
                    }, () => {
                        notify({ message: gettextCatalog.getString('Error during disable request', null, 'Error'), classes: 'notification-danger' });
                    }));
                },
                cancel() {
                    confirmModal.deactivate();
                }
            }
        });
    };

    /**
     * Open modal to add a new address, used by domains and members controllers
     */
    $scope.addAddress = (domain, member) => {

        let showMember = true;

        let domains = $scope.domains;
        if (domain) {
            domains = [domain];
        }
        let members = $scope.members;
        if (member) {
            members = [member];

            // Do not show Add Member button if specific member requested
            showMember = false;
        }

        if (!domains || domains.length === 0) {
            $state.go('secured.domains');
            return;
        }

        if (!$scope.canAddAddress()) {
            return;
        }

        const memberParams = {
            params: {
                organization: $scope.organization,
                organizationKey: $scope.organizationKey,
                domains,
                submit() {
                    memberModal.deactivate();
                    eventManager.call();
                },
                cancel() {
                    memberModal.deactivate();
                }
            }
        };

        addressModal.activate({
            params: {
                domains,
                members,
                organizationKey: $scope.organizationKey,
                showMember,
                addMember() {

                    if (!$scope.canAddMember()) {
                        return;
                    }

                    addressModal.deactivate();
                    memberModal.activate(memberParams);
                },
                submit() {
                    addressModal.deactivate();
                    eventManager.call();
                },
                cancel() {
                    addressModal.deactivate();
                }
            }
        });
    };

    /**
     * Open a modal to edit an address
     */
    $scope.identity = (address) => {
        identityModal.activate({
            params: {
                title: gettextCatalog.getString('Edit address', null, 'Title'),
                address,
                confirm(address) {
                    if (address.custom === false) {
                        address.DisplayName = null;
                        address.Signature = null;
                    }

                    networkActivityTracker.track(
                        Address.edit(address.ID, { DisplayName: address.DisplayName, Signature: address.Signature })
                        .then((result) => {
                            if (angular.isDefined(result.data) && result.data.Code === 1000) {
                                eventManager.call();
                                notify({ message: gettextCatalog.getString('Address updated', null, 'Info'), classes: 'notification-success' });
                                identityModal.deactivate();
                            } else if (angular.isDefined(result.data) && result.data.Error) {
                                notify({ message: result.data.Error, classes: 'notification-danger' });
                            } else {
                                notify({ message: gettextCatalog.getString('Error during updating', null, 'Error'), classes: 'notification-danger' });
                            }
                        }, () => {
                            notify({ message: gettextCatalog.getString('Error during updating', null, 'Error'), classes: 'notification-danger' });
                        })
                    );
                },
                cancel() {
                    identityModal.deactivate();
                }
            }
        });
    };

    /**
     * Open modal to fix keys
     * @param {Object} address
     */
    $scope.generate = (address) => {
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

    $scope.addAlias = () => {

        const self = $scope.getSelf();
        if (self.Type !== 0) {
            notify({ message: gettextCatalog.getString('Only users with existing ProtonMail addresses can add ProtonMail aliases', null, 'Error'), classes: 'notification-danger' });
            return;
        }

        if (!$scope.canAddAddress()) {
            return;
        }

        networkActivityTracker.track(

            Domain.available()
            .then((availableDomains) => {

                const pmDomains = availableDomains.data.Domains.map((domain) => ({ DomainName: domain }));

                addressModal.activate({
                    params: {
                        domains: pmDomains,
                        members: [self],
                        organizationKey: {}, // Aliases not for sub-users
                        submit() {
                            addressModal.deactivate();
                            eventManager.call();
                        },
                        cancel() {
                            addressModal.deactivate();
                        }
                    }
                });
            })
        );
    };

    $scope.saveOrder = (order) => {
        networkActivityTracker.track(
            Address.order({ Order: order })
            .then((result) => {
                if (result.data && result.data.Code === 1000) {
                    notify({ message: gettextCatalog.getString('Order saved', null, 'Info'), classes: 'notification-success' });
                } else if (result.data && result.data.Error) {
                    notify({ message: result.data.Error, classes: 'notification-danger' });
                } else {
                    notify({ message: gettextCatalog.getString('Unable to save your changes, please try again.', null, 'Error'), classes: 'notification-danger' });
                }
            })
        );
    };

    $scope.activateOrganizationKeys = () => {

        let params;
        if ($scope.keyStatus === 1) {
            params = {
                title: gettextCatalog.getString('Key Activation', null, 'Title'),
                prompt: gettextCatalog.getString('Enter password:', null, 'Title'),
                message: gettextCatalog.getString('You must activate your organization private key with the backup organization key password provided to you by your organization administrator.', null, 'Info'),
                alert: gettextCatalog.getString('Without activation you will not be able to create new users, add addresses to existing users, or access non-private user accounts.', null, 'Info'),
                successMessage: gettextCatalog.getString('Organization keys activated', null, 'Info'),
                errorMessage: gettextCatalog.getString('Error activating organization keys', null, 'Error'),
                alertClass: 'alert alert-warning'
            };
        } else if ($scope.keyStatus === 2) {
            params = {
                title: gettextCatalog.getString('Key Activation', null, 'Title'),
                prompt: gettextCatalog.getString('Enter backup key password:', null, 'Title'),
                message: gettextCatalog.getString('You have lost access to your organization private key. Please enter the backup organization key password to reactivate it, or click Reset to generate new keys.', null, 'Info'),
                alert: gettextCatalog.getString('Without activation you will not be able to create new users, add addresses to existing users, or access non-private user accounts.', null, 'Info'),
                successMessage: gettextCatalog.getString('Organization keys restored', null, 'Info'),
                errorMessage: gettextCatalog.getString('Error restoring organization keys', null, 'Error'),
                reset() {
                    activateOrganizationModal.deactivate();
                    $scope.changeOrganizationKeys();
                }
            };
        } else {
            notify({ message: gettextCatalog.getString('Organization keys already active', null, 'Error'), classes: 'notification-success' });
            return;
        }

        _.extend(params, {
            submit(pkg) {

                $scope.keyStatus = 0;
                $scope.organizationKey = pkg;

                activateOrganizationModal.deactivate();
                eventManager.call();
            },
            cancel() {
                activateOrganizationModal.deactivate();
            }
        });

        activateOrganizationModal.activate({ params });
    };

    /**
     * Change organization keys
     */
    $scope.changeOrganizationKeys = () => {

        const nonPrivate = $scope.members.filter((member) => { return member.Private === 0; });
        const otherAdmins = $scope.members.filter((member) => { return member.Role === 2; }).length > 1;

        if (nonPrivate.length > 0 && $scope.keyStatus > 0) {
            notify({ message: gettextCatalog.getString('You must privatize all sub-accounts before generating new organization keys', null, 'Error'), classes: 'notification-danger' });
            return;
        }

        generateOrganizationModal.activate({
            params: {
                nonPrivate,
                existingKey: $scope.organizationKey,
                otherAdmins,
                submit(pkg) {

                    pmcw.keyInfo(pkg.toPublic().armor())
                    .then((obj) => {
                        $scope.organizationKeyInfo = obj;
                    });

                    $scope.keyStatus = 0;
                    $scope.organizationKey = pkg;

                    generateOrganizationModal.deactivate();
                    eventManager.call();
                },
                cancel() {
                    generateOrganizationModal.deactivate();
                }
            }
        });
    };

    addressesInit();
});
