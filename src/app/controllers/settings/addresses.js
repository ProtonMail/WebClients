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
    CONSTANTS,
    Domain,
    domains,
    eventManager,
    Member,
    networkActivityTracker,
    notify,
    Setting
) {
    $scope.activeAddresses = _.where(authentication.user.Addresses, {Status: 1, Receive: 1});
    $scope.disabledAddresses = _.difference(authentication.user.Addresses, $scope.activeAddresses);
    $scope.domains = [];
    $scope.isAdmin = authentication.user.Role === CONSTANTS.PAID_ADMIN;

    $scope.$on('updateUser', function(event) {
        $scope.activeAddresses = _.where(authentication.user.Addresses, {Status: 1, Receive: 1});
        $scope.disabledAddresses = _.difference(authentication.user.Addresses, $scope.activeAddresses);
    });

    // Populate the domains <select>
    _.each(domains, function(domain) {
        $scope.domains.push({label: domain, value: domain});
    });

    // Drag and Drop configuration
    $scope.aliasDragControlListeners = {
        containment: '.pm_form',
        accept: function(sourceItemHandleScope, destSortableScope) {
            return sourceItemHandleScope.itemScope.sortableScope.$id === destSortableScope.$id;
        },
        orderChanged: function() {
            var addresses = $scope.activeAddresses.concat($scope.disabledAddresses);
            var order = [];

            _.forEach(addresses, function(address, index) {
                order[index] = address.Send;
            });

            $scope.saveOrder(order);
        }
    };

    /**
     * Enable an address
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

    $scope.add = function() {
        networkActivityTracker.track(
            Member.query()
            .then(function(result) {
                if (result.data && result.data.Code === 1000) {
                    aliasModal.activate({
                        params: {
                            members: result.data.Members,
                            domains: $scope.domains,
                            add: function(address) {
                                eventManager.call();
                                aliasModal.deactivate();
                            },
                            cancel: function() {
                                aliasModal.deactivate();
                            }
                        }
                    });
                }
            })
        );
    };

    $scope.saveOrder = function(order) {
        networkActivityTracker.track(
            Setting.addressOrder({
                'Order': order
            }).$promise.then(function(response) {
                if (response.Code === 1000) {
                    eventManager.call();
                    notify({message: $translate.instant('ORDER_SAVED'), classes: 'notification-success'});
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
