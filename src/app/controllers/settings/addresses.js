angular.module('proton.controllers.Settings')

.controller('AddressesController', function(
    $q,
    $rootScope,
    $scope,
    $translate,
    Address,
    authentication,
    confirmModal,
    Domain,
    domains,
    eventManager,
    networkActivityTracker,
    notify,
    aliasModal,
    Setting
) {

    $scope.activeAddresses = _.where(authentication.user.Addresses, {Status: 1, Receive: 1});
    $scope.disabledAddresses = _.without(authentication.user.Addresses, $scope.activeAddresses);
    $scope.domains = [];

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
          aliasOrder = [];
          _.forEach($scope.aliases, function(d,i) {
            aliasOrder[i] = d.Send;
          });
          $scope.saveAliases(aliasOrder);
        }
    };

    /**
     * Enable an address
     */
    $scope.enable = function(address) {
        networkActivityTracker.track(Address.enable(address.ID).then(function(result) {
            if(angular.isDefined(result.data) && result.data.Code === 1000) {
                notify({message: $translate.instant('ADDRESS_ENABLED'), classes: 'notification-success'});
                address.Status = 1;
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
                            notify({message: $translate.instant('ADDRESS_DISABLED'), classes: 'notification-success'});
                            address.Status = 0;
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
        console.log($scope.domains);
        aliasModal.activate({
            params: {
                domains: $scope.domains,
                cancel: function() {
                    aliasModal.deactivate();
                }
            }
        });
    };

    $scope.saveAliases = function(aliasOrder) {
        networkActivityTracker.track(
            Setting.addressOrder({
                'Order': aliasOrder
            }).$promise.then(function(response) {
                notify({message: $translate.instant('ALIASES_SAVED'), classes: 'notification-success'});
            }, function(error) {
                notify({message: 'Error during the aliases request', classes : 'notification-danger'});
                $log.error(error);
            })
        );
    };

});
