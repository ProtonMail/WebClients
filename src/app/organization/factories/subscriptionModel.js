import _ from 'lodash';

import { DEFAULT_CURRENCY, DEFAULT_CYCLE } from '../../constants';

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

/* @ngInject */
function subscriptionModel(dispatchers, gettextCatalog, Payment) {
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

    function coupon() {
        const { CouponCode = '' } = get();
        return CouponCode;
    }

    function fetch() {
        return Payment.subscription().then((data = {}) => {
            set(data.Subscription);
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

    on('app.event', (event, { type, data }) => {
        if (type === 'subscription.event') {
            set(data.subscription);
        }
    });

    return { set, get, name, fetch, hasPaid, coupon, count, cycle, currency };
}
export default subscriptionModel;
