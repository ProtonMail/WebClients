angular.module('proton.conversation')
.factory('conversationsInterceptor', ($q, $injector) => {
    return {
        responseError(rep = {}) {

            // If there is an error auto clear the cache then we get the latest config via events
            if (/\/conversations\//.test((rep.config || {}).url)) {
                // Prevent circular dependency
                const cache = $injector.get('cache');
                const eventManager = $injector.get('eventManager');
                cache.reset();
                eventManager.call();
            }

            return rep || $q.reject(rep);
        }
    };
});
