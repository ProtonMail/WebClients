/* @ngInject */
function windowModel(dispatchers) {
    const { on } = dispatchers(['subscription']);
    const CACHE = {
        windows: []
    };
    /**
     * @param {Object} win Window
     * @param {String} type ex: 'paypal'
     */
    const add = (win, type = 'all') => CACHE.windows.push({ win, type });
    /**
     * @param {String} type ex: 'paypal'
     */
    const reset = (key = 'all') => {
        if (key === 'all') {
            CACHE.windows.forEach(({ win }) => win.close());
            CACHE.windows.length = 0;
            return;
        }

        CACHE.windows.forEach(({ win, type }) => (key === type && win.close()));
        CACHE.windows = CACHE.windows.filter(({ type }) => key !== type);
    };

    on('subscription', (e, { type = '' }) => {
        if (type === 'update') {
            // The subscription change, close PayPal tabs to avoid the amount mismatch issue
            reset('paypal');
        }
    });

    return { add, reset };
}

export default windowModel;
