angular.module("proton.controllers.Secured", [])

.controller("SecuredController", function(
    $scope,
    $rootScope,
    authentication,
    eventManager,
    cacheCounters,
    cacheMessages
) {
    $scope.user = authentication.user;
    $scope.logout = $rootScope.logout;

    eventManager.start(authentication.user.EventID);
    cacheMessages.preloadInboxAndSent();
    cacheCounters.query();

    $rootScope.isLoggedIn = true;
    $rootScope.isLocked = false;
    $rootScope.isSecure = function() {
        return authentication.isSecured();
    };

    /**
     * Returns a string for the storage bar
     * @return {String} "12.5"
     */
    $scope.storagePercentage = function() {
        if (authentication.user.UsedSpace && authentication.user.MaxSpace) {
            return Math.round(100 * authentication.user.UsedSpace / authentication.user.MaxSpace);
        } else {
            // TODO: error, undefined variables
            return '';
        }
    };
});
