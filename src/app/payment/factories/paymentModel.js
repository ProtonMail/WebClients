angular.module('proton.payment')
    .factory('paymentModel', (Payment) => {

        let CACHE = {};
        const get = (key) => CACHE[key];
        const set = (key, value) => (CACHE[key] = value);
        const clear = (key) => (key ? CACHE[key] = null : CACHE = {});

        const loadStatus = () => {
            return Payment.status()
                .then(({ data = {} }) => {
                    if (data.Error) {
                        throw new Error(data.Error);
                    }
                    return data;
                })
                .then((data) => set('status', data));
        };


        const loadMethods = () => {
            return Payment.methods()
                .then(({ data = {} }) => {
                    if (data.Error) {
                        throw new Error(data.Error);
                    }
                    return data.PaymentMethods;
                })
                .then((data) => set('methods', data));
        };

        const load = (type, cb) => (refresh) => {
            refresh && clear(type);
            if (get(type)) {
                return Promise.resolve(get(type));
            }
            return cb();
        };

        const getStatus = load('status', loadStatus);
        const getMethods = load('methods', loadMethods);
        const canPay = () => {
            const { Stripe, Paymentwall } = get('status') || {};
            return Stripe || Paymentwall;
        };

        return { getStatus, getMethods, get, canPay };
    });
