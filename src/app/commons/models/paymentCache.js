/* @ngInject */
function PaymentCache(Payment, $cacheFactory, $q, dispatchers) {
    const cache = $cacheFactory('Payments', { number: 30 });
    const { on } = dispatchers();

    const getKey = (method, args) => `${method}-${JSON.stringify(args)}`;

    const fnSync = (method) => (...args) => cache.get(getKey(method, args));

    /**
     * Custom cache because angular's http cache only supports GET requests.
     * @param method
     * @returns {Function}
     */
    const fnAsync = (method) => (...args) => {
        const key = getKey(method, args);

        const result = cache.get(key);
        if (result) {
            return $q.resolve(result);
        }

        return Payment[method](...args).then((result) => {
            cache.put(key, result);
            return result;
        });
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
        acc[`${method}Cached`] = fnSync(method);
        return acc;
    }, {});
}

export default PaymentCache;
