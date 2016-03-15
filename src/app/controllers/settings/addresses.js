angular.module('proton.controllers.Settings')

.controller('AddressesController', function(
    $q,
    $rootScope,
    $scope,
    $translate,
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
    organization,
    Setting
) {
    $scope.activeAddresses = _.where(authentication.user.Addresses, {Status: 1, Receive: 1});
    $scope.disabledAddresses = _.difference(authentication.user.Addresses, $scope.activeAddresses);
    $scope.isAdmin = authentication.user.Role === CONSTANTS.PAID_ADMIN;
    $scope.isFree = authentication.user.Role === CONSTANTS.FREE_USER;
    $scope.itemMoved = false;

    // Drag and Drop configuration
    $scope.aliasDragControlListeners = {
        containment: '.pm_form',
        accept: function(sourceItemHandleScope, destSortableScope) {
            return sourceItemHandleScope.itemScope.sortableScope.$id === destSortableScope.$id;
        },
        dragStart: function() {
            $scope.itemMoved = true;
        },
        dragEnd: function() {
            $scope.itemMoved = false;
        },
        orderChanged: function() {
            var addresses = $scope.activeAddresses.concat($scope.disabledAddresses);
            var order = [];

            _.each(addresses, function(address, index) {
                order[index] = address.Send;
                address.Send = index + 1;
            });

            $scope.saveOrder(order);
        }
    };

    // Set organization
    if (organization.data.Organization) {
        $scope.organization = organization.data.Organization;
    }

    // Listeners
    $scope.$on('updateUser', function(event) {
        if ($scope.itemMoved === false) {
            $scope.activeAddresses = _.where(authentication.user.Addresses, {Status: 1, Receive: 1});
            $scope.disabledAddresses = _.difference(authentication.user.Addresses, $scope.activeAddresses);
        }
    });

    $scope.$on('organizationChange', function(event, organization) {
        $scope.organization = organization;
    });

    /**
     * Return domain value for a specific address
     * @param {Object} address
     * @return {String} domain
     */
    $scope.getDomain = function(address) {
        var email = address.Email.split('@');

        return email[1];
    };

    /**
     * Enable an address
     * @param {Object} address
     */
    $scope.enable = function(address) {
        networkActivityTracker.track(Address.enable(address.ID).then(function(result) {
            if(angular.isDefined(result.data) && result.data.Code === 1000) {
                eventManager.call();
                notify({message: $translate.instant('ADDRESS_ENABLED'), classes: 'notification-success'});
            } else if(angular.isDefined(result.data) && result.data.Error) {
                notify({message: result.data.Error, classes: 'notification-danger'});
            } else {
                notify({message: $translate.instant('ERROR_DURING_ENABLE'), classes: 'notification-danger'});
            }
        }, function(error) {
            notify({message: $translate.instant('ERROR_DURING_ENABLE'), classes: 'notification-danger'});
        }));
    };

    /**
     * Open a modal to disable an address
     */
    $scope.disable = function(address) {
        confirmModal.activate({
            params: {
                title: $translate.instant('DISABLE_ADDRESS'),
                message: $translate.instant('Are you sure you want to disable this address?'),
                confirm: function() {
                    networkActivityTracker.track(Address.disable(address.ID).then(function(result) {
                        if(angular.isDefined(result.data) && result.data.Code === 1000) {
                            eventManager.call();
                            notify({message: $translate.instant('ADDRESS_DISABLED'), classes: 'notification-success'});
                            confirmModal.deactivate();
                        } else if(angular.isDefined(result.data) && result.data.Error) {
                            notify({message: result.data.Error, classes: 'notification-danger'});
                        } else {
                            notify({message: $translate.instant('ERROR_DURING_DISABLE'), classes: 'notification-danger'});
                        }
                    }, function(error) {
                        notify({message: $translate.instant('ERROR_DURING_DISABLE'), classes: 'notification-danger'});
                    }));
                },
                cancel: function() {
                    confirmModal.deactivate();
                }
            }
        });
    };

    /**
     * Open a modal to edit an address
     */
    $scope.identity = function(address) {
        identityModal.activate({
            params: {
                title: $translate.instant('EDIT_ADDRESS'),
                address: address,
                confirm: function(address) {
                    if (address.custom === false) {
                        address.DisplayName = null;
                        address.Signature = null;
                    }

                    networkActivityTracker.track(
                        Address.edit(address.ID, {DisplayName: address.DisplayName, Signature: address.Signature})
                        .then(function(result) {
                            if(angular.isDefined(result.data) && result.data.Code === 1000) {
                                eventManager.call();
                                notify({message: $translate.instant('ADDRESS_UPDATED'), classes: 'notification-success'});
                                identityModal.deactivate();
                            } else if(angular.isDefined(result.data) && result.data.Error) {
                                notify({message: result.data.Error, classes: 'notification-danger'});
                            } else {
                                notify({message: $translate.instant('ERROR_DURING_UPDATING'), classes: 'notification-danger'});
                            }
                        }, function(error) {
                            notify({message: $translate.instant('ERROR_DURING_UPDATING'), classes: 'notification-danger'});
                        })
                    );
                },
                cancel: function() {
                    identityModal.deactivate();
                }
            }
        });
    };

    /**
     * Delete address
     * @param {Object} address
     */
    $scope.delete = function(address) {
        var index = $scope.disabledAddresses.indexOf(address);

        confirmModal.activate({
            params: {
                title: $translate.instant('DELETE_ADDRESS'),
                message: $translate.instant('Are you sure you want to delete this address?'),
                confirm: function() {
                    networkActivityTracker.track(Address.delete(address.ID).then(function(result) {
                        if(angular.isDefined(result.data) && result.data.Code === 1000) {
                            notify({message: $translate.instant('ADDRESS_DELETED'), classes: 'notification-success'});
                            $scope.disabledAddresses.splice(index, 1); // Remove address in UI
                            confirmModal.deactivate();
                        } else if(angular.isDefined(result.data) && result.data.Error) {
                            notify({message: result.data.Error, classes: 'notification-danger'});
                        } else {
                            notify({message: $translate.instant('ERROR_DURING_DELETION'), classes: 'notification-danger'});
                        }
                    }, function(error) {
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
     * Open modal to fix keys
     * @param {Object} address
     */
    $scope.generate = function(address) {
        generateModal.activate({
            params: {
                title: $translate.instant('GENERATE_KEY_PAIR'),
                message: '', // TODO need text
                addresses: [address],
                cancel: function() {
                    eventManager.call();
                    generateModal.deactivate();
                }
            }
        });
    };

    $scope.add = function() {
        networkActivityTracker.track(
            $q.all({
                members: Member.query(),
                domains: Domain.available()
            })
            .then(function(result) {
                aliasModal.activate({
                    params: {
                        members: result.members.data.Members,
                        domains: result.domains.data.Domains,
                        add: function(address) {
                            eventManager.call();
                            aliasModal.deactivate();
                        },
                        cancel: function() {
                            aliasModal.deactivate();
                        }
                    }
                });
            })
        );
    };

    $scope.saveOrder = function(order) {
        networkActivityTracker.track(
            Setting.addressOrder({
                'Order': order
            }).$promise.then(function(response) {
                if (response.Code === 1000) {
                    notify({message: $translate.instant('ADDRESS_ORDER_SAVED'), classes: 'notification-success'});
                } else if (response.Error) {
                    notify({message: response.Error, classes: 'notification-danger'});
                } else {
                    notify({message: 'Error during the order request', classes : 'notification-danger'});
                }
            }, function(error) {
                notify({message: 'Error during the order request', classes : 'notification-danger'});
                $log.error(error);
            })
        );
    };
});
