angular.module("proton.controllers.Settings")

.controller('FiltersController', function(
    $log,
    $rootScope,
    $scope,
    $state,
    $window,
    gettextCatalog,
    $q,
    authentication,
    networkActivityTracker,
    Setting,
    incomingDefaults,
    IncomingDefault,
    notify
) {

    // Variables
    $scope.IncomingDefaults = incomingDefaults.data.IncomingDefaults;

    $scope.clearDefaults = function() {
        networkActivityTracker.track(
            IncomingDefault.clear()
            .then(function(result) {
                if (result.data && result.data.Code === 1000) {
                    $scope.IncomingDefaults = [];
                    notify({
                        message: gettextCatalog.getString('Default incomming rules cleared', null), 
                        classes: 'notification-success'
                    });
                }
            })
        );
    };

    $scope.refreshDefaults = function() {
        networkActivityTracker.track(
            IncomingDefault.get()
            .then(function(result) {
                if (result.data && result.data.Code === 1000) {
                    $scope.IncomingDefaults = result.data.IncomingDefaults;
                    notify({
                        message: gettextCatalog.getString('Default incomming rules refreshed', null), 
                        classes: 'notification-success'
                    });
                }
            })
        );

    };

    $scope.deleteSelectedDefaults = function() {

    };


});
