/* @ngInject */
function conversationsInterceptor($q, $injector) {
    return {
        responseError(rep = {}) {
            // If there is an error auto clear the cache then we get the latest config via events
            if (/\/conversations\//.test((rep.config || {}).url)) {
                // Prevent circular dependency
                const cache = $injector.get('cache');
                const cacheCounters = $injector.get('cacheCounters');
                const eventManager = $injector.get('eventManager');
                cache.reset();
                cacheCounters.reset();
                eventManager.call();
            }

            return $q.reject(rep);
        }
    };
}
export default conversationsInterceptor;
