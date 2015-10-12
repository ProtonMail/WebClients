angular.module("proton.controllers.Settings")

.controller('DashboardController', function($rootScope, $scope, authentication) {
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
