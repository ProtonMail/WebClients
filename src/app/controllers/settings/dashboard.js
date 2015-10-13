angular.module("proton.controllers.Settings")

.controller('DashboardController', function($rootScope, $scope, authentication) {
    $scope.currency = 'CHF';
    $scope.username = authentication.user.Addresses[0].Email.split('@')[0];
    $scope.plan = 'basic';
    $scope.billing = 'monthly';

    /**
     * Returns a string for the storage bar
     * @return {String} "12.5%"
     */
    $scope.storagePercentage = function() {
        if (authentication.user.UsedSpace && authentication.user.MaxSpace) {
            return Math.round(100 * authentication.user.UsedSpace / authentication.user.MaxSpace) + '%';
        } else {
            // TODO: error, undefined variables
            return '';
        }
    };
});
