import { CURRENCIES, CYCLE } from '../../constants';

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

    /**
     *Clear cache when the user changes for credits
     */
    on('updateUser', () => {
        cache.removeAll();
    });

    on('logout', () => {
        cache.removeAll();
    });

    const methods = ['valid', 'plans'];

    const out = methods.reduce((acc, method) => {
        acc[method] = fnAsync(method);
        return acc;
    }, {});

    /**
     * Special caching for plans when you specify an undefined currency to see if it's already cached.
     * This can happen in the dashboard model where we always get with a currency.
     * But in some cases we don't care for it and just want to plan ids.
     * @param {Object}
     * @returns {*}
     */
    const plans = ({ Cycle = CYCLE.MONTHLY, Currency } = {}) => {
        if (!Currency) {
            const currency = CURRENCIES.find((currency) => {
                const key = getKey('plans', [{ Cycle, Currency: currency }]);
                return cache.get(key);
            });
            if (currency) {
                return out.plans({ Cycle, Currency: currency });
            }
        }
        return out.plans({ Cycle, Currency });
    };

    return {
        ...out,
        plans
    };
}

export default PaymentCache;
