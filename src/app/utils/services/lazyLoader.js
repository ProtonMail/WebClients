/* @ngInject */
function lazyLoader($ocLazyLoad, networkActivityTracker) {
    const CACHE = { loaded: 0 };

    // On build we will rename these files via sed. DON'T TOUCH THEM
    const FILES = {
        app: 'appLazy.js',
        vendor: 'vendorLazy.js',
        vendor2: 'vendorLazy2.js'
    };

    const load = async (type) => {
        CACHE[type] = $ocLazyLoad.load(FILES[type]);
        await CACHE[type];
        delete CACHE[type];
        CACHE.loaded++;
    };

    /**
     * Lazy load the application
     *     1 - Lazy load when the app is loaded
     *     2 - Lazy load when you switch to state secured
     * For the 2sd call, check if everything is already loaded or not.
     * @return {Promise}
     */
    const app = async () => {
        if (CACHE.vendor) {
            return CACHE.vendor.then(() => load('app'));
        }

        if (CACHE.app) {
            return CACHE.app;
        }

        if (CACHE.loaded === 2) {
            return;
        }

        const promise = load('vendor').then(() => load('app'));
        return networkActivityTracker.track(promise);
    };

    const extraVendor = () => {
        return networkActivityTracker.track(load('vendor2'));
    };
    return { app, extraVendor };
}

export default lazyLoader;
