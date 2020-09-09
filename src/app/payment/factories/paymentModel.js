/* @ngInject */
function paymentModel(
    eventManager,
    Payment,
    networkActivityTracker,
    gettextCatalog,
    notification,
    dispatchers,
    translator
) {
    let CACHE = {};

    const I18N = translator(() => ({
        VALID_CODE: gettextCatalog.getString('Code accepted', null, 'Code request'),
        INVALID_CODE: gettextCatalog.getString('Invalid code', null, 'Error when applying coupon code or gift code')
    }));

    const { on } = dispatchers();

    const get = (key) => CACHE[key];
    const set = (key, value) => (CACHE[key] = value);
    const clear = (key) => (key ? (CACHE[key] = null) : (CACHE = {}));

    const loadStatus = () => {
        return Payment.status()
            .then(({ data = {} }) => data)
            .then((data) => set('status', data));
    };

    const loadMethods = ({ subuser } = {}) => {
        if (subuser) {
            return Promise.resolve([]);
        }
        return Payment.methods()
            .then(({ data = {} }) => data.PaymentMethods)
            .then((data) => set('methods', data));
    };

    const load = (type, cb) => (refresh, data) => {
        refresh && clear(type);
        if (get(type)) {
            return Promise.resolve(get(type));
        }
        return cb(data);
    };

    const getStatus = load('status', loadStatus);
    const getMethods = load('methods', loadMethods);

    const canPay = () => {
        const { Stripe, Paymentwall } = get('status') || {};
        return Stripe || Paymentwall;
    };

    function subscribe(config) {
        return Payment.subscribe(config).then(({ data = {} } = {}) => data);
    }

    function add(params) {
        const promise = Payment.valid(params).then((data) => {
            const { Codes = [] } = params;
            const { Code = '' } = data.Coupon || {}; // Coupon can equal null

            if (Codes.length && !Codes.includes(Code) && !data.Gift) {
                throw new Error(I18N.INVALID_CODE);
            }

            notification.success(I18N.VALID_CODE);

            return data;
        });

        networkActivityTracker.track(promise);

        return promise;
    }

    function useGiftCode(GiftCode) {
        const promise = Payment.validateCredit({ GiftCode })
            .then(() => Payment.credit({ GiftCode, Amount: 0 }))
            .then(() => eventManager.call());

        networkActivityTracker.track(promise);

        return promise;
    }

    on('payments', (e, { type }) => {
        if (/^(donation|topUp)\.request\.success/.test(type)) {
            loadMethods();
        }
    });

    on('logout', () => {
        clear();
    });

    return { getStatus, getMethods, get, canPay, subscribe, add, useGiftCode, clear };
}
export default paymentModel;
