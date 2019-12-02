import _ from 'lodash';

import { DEFAULT_CURRENCY, DEFAULT_CYCLE, PLANS_TYPE, BLACK_FRIDAY } from '../../constants';

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
    space: '1gb',
    domain: '1domain',
    member: '1member',
    vpn: '1vpn'
};

/* @ngInject */
function subscriptionModel(dispatchers, Payment, $injector) {
    const CACHE = {};
    const { dispatcher, on } = dispatchers(['subscription']);

    const get = () => angular.copy(CACHE.subscription || {});
    const count = (addon) => {
        const { Quantity = 0 } = _.find(CACHE.subscription.Plans, { Name: MAP_ADDONS[addon] }) || {};
        return Quantity;
    };

    const hasFactory = (plans = []) => () => {
        const { Plans = [] } = CACHE.subscription || {};
        return _.some(Plans, ({ Name }) => plans.indexOf(Name) > -1);
    };

    const currency = () => {
        const { Plans = [] } = CACHE.subscription || {};
        const [{ Currency = DEFAULT_CURRENCY } = {}] = Plans;
        return Currency;
    };

    const cycle = () => {
        const { Plans = [] } = CACHE.subscription || {};
        const [{ Cycle = DEFAULT_CYCLE } = {}] = Plans;
        return Cycle;
    };

    const hasPaid = (type) => hasFactory(PAID_TYPES[type])();

    /**
     * Detect mozilla case from subscription
     * @return {Boolean}
     */
    const isMoz = () => {
        const { CouponCode } = CACHE.subscription || {};
        const coupon = CouponCode || ''; // CouponCode can be null

        return coupon.startsWith('MOZILLA') || coupon.startsWith('MOZTEST');
    };

    /**
     * Format plans to add the Quantity parameter until the API apply this change
     * @param  {Object} subscription
     * @return {Object} subscription
     */
    const formatPlans = (subscription = {}) => {
        if (Array.isArray(subscription.Plans)) {
            const counter = _.reduce(
                subscription.Plans,
                (acc, plan) => {
                    acc[plan.ID] = acc[plan.ID] || 0;
                    acc[plan.ID] += plan.Quantity;

                    return acc;
                },
                {}
            );

            subscription.Plans.forEach((plan) => {
                plan.Quantity = counter[plan.ID];
            });
        }

        return subscription;
    };

    function set(subscription = {}, noEvent = false) {
        const copy = angular.copy(formatPlans(subscription));
        CACHE.subscription = copy;
        !noEvent && dispatcher.subscription('update', { subscription: copy });
    }

    function setVPN(data = {}) {
        CACHE.vpn = angular.copy(data);
    }

    function coupon() {
        const { CouponCode } = get();
        // CouponCode is apparently null from the API.
        return !CouponCode ? undefined : CouponCode;
    }

    function fetch() {
        const promises = [Payment.subscription(), $injector.get('vpnApi').get()];

        return Promise.all(promises).then(([subData = {}, vpnData = {}]) => {
            set(subData.Subscription);
            setVPN((vpnData.data || {}).VPN);
            return get();
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

    const withCoupon = (coupon) => {
        const { CouponCode = '' } = CACHE.subscription || {};
        return CouponCode === coupon;
    };

    const isPlusForBF2019 = (cycle = DEFAULT_CYCLE) => {
        const isPlus = hasPaid('plus');
        const hasCoupon = withCoupon(BLACK_FRIDAY.COUPON_CODE);

        const { Plans = [] } = CACHE.subscription || {};
        const total = Plans.filter(({ Type, Cycle }) => Type === PLANS_TYPE.PLAN && Cycle === cycle).length;

        // Plus account, only plus plan and no coupon bf2019 active
        return isPlus && total === 1 && !hasCoupon;
    };

    on('app.event', (event, { type, data }) => {
        if (type === 'subscription.event') {
            set(data.subscription);
        }
    });

    return { isPlusForBF2019, withCoupon, set, get, name, fetch, hasPaid, coupon, count, cycle, currency, isMoz };
}
export default subscriptionModel;
