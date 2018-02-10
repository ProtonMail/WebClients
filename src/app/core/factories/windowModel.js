/* @ngInject */
function windowModel(dispatchers) {
    const { on } = dispatchers(['subscription']);
    const CACHE = {
        windows: []
    };
    /**
     * @param {Object} options.win Window
     * @param {Function} options.unsubscribe Callback to unsubscribe the listener postMessage attach to win
     * @param {String} options.type if you want to register a custom window scope ex: paypal
     */
    const add = (config) => CACHE.windows.push(config);

    /**
     * @param {String} type ex: 'paypal'
     */
    const reset = (key = 'all') => {
        if (key === 'all') {
            CACHE.windows.forEach(({ win, unsubscribe }) => (win.close(), unsubscribe()));
            CACHE.windows.length = 0;
            return;
        }

        CACHE.windows.forEach(({ win, type, unsubscribe }) => (key === type && (win.close(), unsubscribe())));
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
