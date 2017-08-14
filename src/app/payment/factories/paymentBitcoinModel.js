angular.module('proton.payment')
    .factory('paymentBitcoinModel', ($rootScope, Payment, networkActivityTracker, CONSTANTS) => {

        const load = angular.noop;
        const CACHE = {};
        const TYPE_DONATION = 'donation';
        const { MIN_BITCOIN_AMOUNT } = CONSTANTS;

        const dispatch = (type, data = {}) => $rootScope.$emit('payment', { type, data });

        const set = (key, value) => (CACHE[key] = value);
        const get = (key) => angular.copy(key ? CACHE[key] : CACHE);
        const reset = () => {
            CACHE.input = null;
            CACHE.payment = null;
        };

        const generate = ({ amount, currency, type }) => {
            reset();
            set('input', { amount, currency, type });

            if (amount < MIN_BITCOIN_AMOUNT) {
                return dispatch('bitcoin.validator.error', { type: 'amount' });
            }

            if (type === TYPE_DONATION) {
                return dispatch('bitcoin.success', { isDonation: true });
            }

            const promise = Payment.btc(amount, currency)
                .then(({ data = {} }) => {
                    if (data.Error) {
                        throw new Error(data.Error);
                    }
                    return data;
                })
                .then((data) => (set('payment', data), data))
                .then((data) => dispatch('bitcoin.success', data))
                .catch((error) => {
                    dispatch('bitcoin.error', error);
                    throw error;
                });

            networkActivityTracker.track(promise);
        };

        const isDonation = () => get('input').type === TYPE_DONATION;

        $rootScope.$on('payment', (e, { type, data }) => {
            (type === 'bitcoin.submit') && generate(data);
        });

        return { get, load, isDonation };
    });
