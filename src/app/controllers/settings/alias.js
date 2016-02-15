angular.module('proton.controllers.Settings')

.controller('AliasController', function(
    $q,
    $rootScope,
    $scope,
    $translate,
    authentication,
    Domain,
    domains,
    eventManager,
    networkActivityTracker,
    notify,
    aliasModal
) {

    $scope.aliases = authentication.user.Addresses;
    $scope.domains = [];

    // Populate the domains <select>
    _.each(domains, function(domain) {
        $scope.domains.push({label: domain, value: domain});
    });

    // Drag and Drop configuration
    $scope.aliasDragControlListeners = {
        containment: ".pm_form",
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
                "Order": aliasOrder
            }).$promise.then(function(response) {
                notify({message: $translate.instant('ALIASES_SAVED'), classes: 'notification-success'});
            }, function(error) {
                notify({message: 'Error during the aliases request', classes : 'notification-danger'});
                $log.error(error);
            })
        );
    };

});
