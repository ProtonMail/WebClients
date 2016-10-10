angular.module('proton.controllers.Settings')

.controller('AddressesController', (
    $q,
    $rootScope,
    $scope,
    gettextCatalog,
    Address,
    aliasModal,
    authentication,
    confirmModal,
    identityModal,
    CONSTANTS,
    Domain,
    eventManager,
    generateModal,
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

    $scope.$on('createUser', () => {
        notify({ message: gettextCatalog.getString('Address created', null, 'Info'), classes: 'notification-success' });
    });

    /**
     * Return domain value for a specific address
     * @param {Object} address
     * @return {String} domain
     */
    $scope.getDomain = function (address) {
        const email = address.Email.split('@');

        return email[1];
    };

    /**
     * Enable an address
     * @param {Object} address
     */
    $scope.enable = function (address) {
        networkActivityTracker.track(Address.enable(address.ID).then((result) => {
            if (angular.isDefined(result.data) && result.data.Code === 1000) {
                eventManager.call();
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
    $scope.disable = function (address) {
        confirmModal.activate({
            params: {
                title: gettextCatalog.getString('Disable address', null),
                message: gettextCatalog.getString('Are you sure you want to disable this address?', null, 'Title'),
                confirm() {
                    networkActivityTracker.track(Address.disable(address.ID).then((result) => {
                        if (angular.isDefined(result.data) && result.data.Code === 1000) {
                            eventManager.call();
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
     * Open a modal to edit an address
     */
    $scope.identity = function (address) {
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
     * Delete address
     * @param {Object} address
     */
    $scope.delete = function (address) {
        const index = $scope.disabledAddresses.indexOf(address);

        confirmModal.activate({
            params: {
                title: gettextCatalog.getString('Delete address', null, 'Title'),
                message: gettextCatalog.getString('Are you sure you want to delete this address?', null, 'Info'),
                confirm() {
                    networkActivityTracker.track(Address.delete(address.ID).then((result) => {
                        if (angular.isDefined(result.data) && result.data.Code === 1000) {
                            notify({ message: gettextCatalog.getString('Address deleted', null, 'Info'), classes: 'notification-success' });
                            $scope.disabledAddresses.splice(index, 1); // Remove address in UI
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

    $scope.add = function () {
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

    $scope.saveOrder = function (order) {
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
