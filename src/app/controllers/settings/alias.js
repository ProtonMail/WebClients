angular.module('proton.controllers.Settings')

.controller('AliasController', function(
    $log,
    $rootScope,
    $scope,
    $timeout,
    $translate,
    $q,
    authentication,
    networkActivityTracker,
    notify,
    pmcw,
    Setting
) {

    $scope.aliases = authentication.user.Addresses;

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
