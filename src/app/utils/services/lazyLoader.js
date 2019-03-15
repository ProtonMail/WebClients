/* @ngInject */
function lazyLoader(networkActivityTracker, notification, gettextCatalog, AppModel, $injector, translator) {
    const CACHE = { loaded: 0 };

    const I18N = translator(() => ({
        OUTDATED: gettextCatalog.getString(
            'You are using an outdated version of ProtonMail, please refresh the page.',
            null,
            'Error'
        ),
        ACTION: gettextCatalog.getString('Reload ProtonMail', null, 'Action')
    }));

    const getImport = (type) => {
        if (type === 'app') {
            return import(/* webpackChunkName: "appLazy.module" */ '../../appLazy');
        }

        if (type === 'vendor') {
            return import(/* webpackChunkName: "vendorLazy.module" */ '../../vendorLazy');
        }

        if (type === 'vendor2') {
            return import(/* webpackChunkName: "vendor2Lazy.module" */ '../../vendorLazy2');
        }

        throw new Error('unknown lazy load');
    };

    /**
     * Lazy load app and ask for a reload when we can't find the file
     *     - the file is uniq/version
     * @param  {String} type Type of content to load
     * @return {Promise}
     */
    const load = async (type) => {
        try {
            CACHE[type] = getImport(type);

            const module = await CACHE[type];

            // With all lazy loaded modules, there are new modules to inject.
            $injector.loadNewModules([module.default.name]);

            delete CACHE[type];
            CACHE.loaded++;
        } catch (e) {
            console.log('error', e);

            // The error does not contain the http error...
            if (!AppModel.get('onLine')) {
                return;
            }

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
