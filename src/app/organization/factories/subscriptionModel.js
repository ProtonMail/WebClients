angular.module('proton.organization')
.factory('subscriptionModel', ($rootScope, gettextCatalog, Payment) => {
    const CACHE = [];
    const ERROR_SUBSCRIPTION = gettextCatalog.getString('Subscription request failed', null, 'Error');
    const get = () => angular.copy(CACHE.subscription || {});
    const PAID_TYPES = {
        plus: ['plus'],
        professional: ['professional'],
        visionary: ['visionary'],
        mail: ['plus', 'visionary'],
        vpn: ['vpnbasic', 'vpnplus', 'visionary']
    };

    const hasFactory = (plans = []) => () => {
        const { Plans = [] } = (CACHE.subscription || {});
        return _.some(Plans, ({ Name }) => plans.indexOf(Name) > -1);
    };

    const hasPaid = (type) => hasFactory(PAID_TYPES[type])();

    function set(subscription = {}, noEvent = false) {
        CACHE.subscription = angular.copy(subscription);
        !noEvent && $rootScope.$emit('subscription', { type: 'update', data: { subscription } });
    }

    function coupon() {
        const { CouponCode = '' } = get();
        return CouponCode;
    }

    function fetch() {
        return Payment.subscription()
            .then(({ data = {} } = {}) => {
                if (data.Code === 1000) {
                    set(data.Subscription);
                    return get();
                }
                throw new Error(data.Error || ERROR_SUBSCRIPTION);
            });
    }

    function name() {
        if (hasPaid('plus')) {
            return 'plus';
        }

        if (hasPaid('professional')) {
            return 'professional';
        }

        if (hasPaid('visionary')) {
            return 'visionary';
        }

        return 'free';
    }

    function count(addon) {
        switch (addon) {
            case 'address':
                return _.where(CACHE.subscription.Plans, { Name: '5address' }).length;
            case 'storage':
                return _.where(CACHE.subscription.Plans, { Name: '1gb' }).length;
            case 'domain':
                return _.where(CACHE.subscription.Plans, { Name: '1domain' }).length;
            case 'member':
                return _.where(CACHE.subscription.Plans, { Name: '1member' }).length;
            default:
                return 0;
        }
    }

    return { set, get, name, fetch, hasPaid, coupon, count };
});
