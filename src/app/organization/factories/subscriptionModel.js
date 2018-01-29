import _ from 'lodash';

/* @ngInject */
function subscriptionModel($rootScope, CONSTANTS, gettextCatalog, Payment) {
    const CACHE = {};
    const ERROR_SUBSCRIPTION = gettextCatalog.getString('Subscription request failed', null, 'Error');

    const PAID_TYPES = {
        plus: ['plus'],
        professional: ['professional'],
        visionary: ['visionary'],
        mail: ['plus', 'professional', 'visionary'],
        vpn: ['vpnbasic', 'vpnplus', 'visionary'],
        vpnbasic: ['vpnbasic'],
        vpnplus: ['vpnplus']
    };

    const MAP_ADDONS = {
        address: '5address',
        storage: '1gb',
        domain: '1domain',
        member: '1member',
        vpn: '1vpn'
    };

    const get = () => angular.copy(CACHE.subscription || {});
    const count = (addon) => _.filter(CACHE.subscription.Plans, { Name: MAP_ADDONS[addon] }).length;

    const hasFactory = (plans = []) => () => {
        const { Plans = [] } = CACHE.subscription || {};
        return _.some(Plans, ({ Name }) => plans.indexOf(Name) > -1);
    };

    const currency = () => {
        const { Plans = [] } = CACHE.subscription || {};
        const [{ Currency = CONSTANTS.DEFAULT_CURRENCY } = {}] = Plans;
        return Currency;
    };

    const cycle = () => {
        const { Plans = [] } = CACHE.subscription || {};
        const [{ Cycle = CONSTANTS.DEFAULT_CYCLE } = {}] = Plans;
        return Cycle;
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
            .then((data = {}) => {
                set(data.Subscription);
                return get();
            })
            .catch(({ data = {} } = {}) => {
                throw Error(data.Error || ERROR_SUBSCRIPTION);
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

    return { set, get, name, fetch, hasPaid, coupon, count, cycle, currency };
}
export default subscriptionModel;
