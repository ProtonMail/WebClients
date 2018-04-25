/* @ngInject */
function lazyLoader($ocLazyLoad, networkActivityTracker, notification, gettextCatalog) {
    const CACHE = { loaded: 0 };

    const I18N = {
        OUTDATED: gettextCatalog.getString(
            'You are using an outdated version of ProtonMail, please refresh the page.',
            null,
            'Error'
        ),
        ACTION: gettextCatalog.getString('Reload ProtonMail', null, 'Action')
    };

    // On build we will rename these files via sed. DON'T TOUCH THEM
    const FILES = {
        app: 'appLazy.js',
        vendor: 'vendorLazy.js',
        vendor2: 'vendorLazy2.js'
    };

    /**
     * Lazy load app and ask for a reload when we can't find the file
     *     - the file is uniq/version
     * @param  {String} type Type of content to load
     * @return {Promise}
     */
    const load = async (type) => {
        try {
            CACHE[type] = $ocLazyLoad.load(FILES[type]);
            await CACHE[type];
            delete CACHE[type];
            CACHE.loaded++;
        } catch (e) {
            console.error(e);
            // cf caching issue with when we deploy new assets #6888
            notification.error(`${I18N.OUTDATED} <a>${I18N.ACTION}</a>`, {
                duration: 0,
                onClose() {
                    window.location.reload();
                }
            });
        }
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
