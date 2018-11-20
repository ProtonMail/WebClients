/* @ngInject */
function PaymentCache(Payment, $cacheFactory, dispatchers) {
    const cache = $cacheFactory('Payments', { number: 30 });
    const { on } = dispatchers();

    const getKey = (method, args) => `${method}-${JSON.stringify(args)}`;

    /**
     * Custom cache because angular's http cache only supports GET requests.
     * @param {String} method - method name to override in Payment
     * @returns {Function}
     */
    const fnAsync = (method) => (...args) => {
        const key = getKey(method, args);

        const result = cache.get(key);
        if (result) {
            return result;
        }

        const promise = Payment[method](...args).catch((e) => {
            cache.remove(key);
            return Promise.reject(e);
        });

        cache.put(key, promise);
        return promise;
    };

    /**
     * Clear cache when the subscription changes because the valid route changes depending on it.
     */
    on('app.event', (event, { type }) => {
        if (type === 'subscription.event') {
            cache.removeAll();
        }
    });

    on('logout', () => {
        cache.removeAll();
    });

    const methods = ['valid', 'plans'];

    return methods.reduce((acc, method) => {
        acc[method] = fnAsync(method);
        return acc;
    }, {});
}

export default PaymentCache;
