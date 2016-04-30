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
    notify
) {

    // Variables
    $scope.IncomingDefaults = incomingDefaults.data.IncomingDefaults;

});
