angular.module('proton.controllers.Settings')

.controller('AddressesController', (
    $q,
    $rootScope,
    $scope,
    gettextCatalog,
    Address,
    addressModal,
    aliasModal,
    authentication,
    confirmModal,
    identityModal,
    CONSTANTS,
    Domain,
    eventManager,
    generateModal,
    memberModal,
    Member,
    networkActivityTracker,
    notify,
    Setting
) => {
    $scope.activeAddresses = _.where(authentication.user.Addresses, { Status: 1, Receive: 1 });
    $scope.disabledAddresses = _.difference(authentication.user.Addresses, $scope.activeAddresses);
    $scope.itemMoved = false;

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
     * Open modal to add a new address
     */
    $scope.addAddress = (domain = {}) => {

        const memberParams = {
            params: {
                organization: $scope.organization,
                organizationPublicKey: $scope.organizationPublicKey,
                domains: [domain],
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
                domains: [domain],
                members: $scope.members,
                organizationPublicKey: $scope.organizationPublicKey,
                addMember() {
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
        networkActivityTracker.track(
            $q.all({
                members: Member.query(),
                domains: Domain.available()
            })
            .then((result) => {
                aliasModal.activate({
                    params: {
                        members: result.members.data.Members,
                        domains: result.domains.data.Domains,
                        add() {
                            eventManager.call();
                            aliasModal.deactivate();
                        },
                        cancel() {
                            aliasModal.deactivate();
                        }
                    }
                });
            })
        );
    };

    $scope.saveOrder = (order) => {
        networkActivityTracker.track(
            Setting.addressOrder({ Order: order })
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
});
