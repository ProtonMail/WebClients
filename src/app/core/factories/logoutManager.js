angular.module('proton.core')
.factory('logoutManager', ($rootScope, authentication, eventManager, cache, cacheCounters) => {
    $rootScope.$on('$stateChangeSuccess', (e, state) => {
        const currentState = state.name;

        if (currentState.indexOf('secured') === -1) {
            // Stop event manager request
            eventManager.stop();
            // Clear cache
            cache.reset();
            cacheCounters.reset();
            // We automatically logout the user when he comes to login page and is already logged in
            authentication.isLoggedIn() && authentication.logout();
        }
    });
    return {};
});
