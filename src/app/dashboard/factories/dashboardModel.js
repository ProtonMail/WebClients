angular.module('proton.dashboard')
    .factory('dashboardModel', (CONSTANTS, Payment, subscriptionModel, networkActivityTracker) => {

        const YEARLY = 12;
        const MONTHLY = 1;
        const { PLANS_TYPE } = CONSTANTS;
        const CACHE_PLAN = {};
        const CACHE_API = {};

        const get = (key) => {
            const cache = angular.copy(CACHE_PLAN);
            return key ? cache[key] : cache;
        };

        const query = (currency = 'USD', cycle = YEARLY) => {
            const key = `plans-${currency}-${cycle}`;
            const { Plans = [] } = CACHE_API[key] || {};

            return Plans;
        };

        const fetchPlans = (currency = 'USD', cycle = YEARLY) => {
            const key = `plans-${currency}-${cycle}`;

            if (CACHE_API[key]) {
                return Promise.resolve(CACHE_API[key]);
            }

            return Payment.plans(currency, cycle)
                .then(({ data = {} }) => {
                    if (data.Code !== 1000) {
                        throw new Error(data.Error);
                    }
                    CACHE_API[key] = data;
                    return data;
                });
        };

        /**
         * Load plan for a cycle and a currency, then create a map for them
         *  - addons: (Type === 0)
         *  - plan: (Type === 1)
         *  - vpn: (Type === 1)
         *  And a list of plan, ProtonMail plan (not vpn)
         * @param  {String} currency
         * @param  {Number} cycle
         * @return {Promise}
         */
        const loadPlanCycle = (currency, cycle = YEARLY) => {
            return fetchPlans(currency, cycle)
                .then((data = {}) => {
                    const { list, addons, vpn, plan } = (data.Plans || []).reduce((acc, plan) => {

                        if (plan.Type === PLANS_TYPE.PLAN) {
                            const key = (plan.Name.indexOf('vpn') === 0) ? 'vpn' : 'plan';
                            acc[key][plan.Name] = plan;

                            (key === 'plan' && plan.Name !== 'business') && acc.list.push(plan);
                        }

                        (plan.Type === PLANS_TYPE.ADDON) && (acc.addons[plan.Name] = plan);
                        return acc;
                    }, { addons: {}, plan: {}, vpn: {}, list: [] });
                    return { list, addons, vpn, plan };
                });
        };

        /**
         * Load all plans for a currency then create a cache representation
         * for them sorted by Cycle alias.
         *  - yearly = cycle = 12
         *  - monthly = cycle = 1
         * Each key contains 4 keys with 3 maps and a list.
         * @param  {String} Currency
         * @return {Promise}
         */
        const loadPlans = (Currency) => {
            const promise = Promise.all([ loadPlanCycle(Currency), loadPlanCycle(Currency, MONTHLY) ])
                .then(([ yearly, monthly ]) => {
                    CACHE_PLAN.yearly = angular.copy(yearly);
                    CACHE_PLAN.monthly = angular.copy(monthly);
                    return angular.copy(CACHE_PLAN);
                });

            networkActivityTracker.track(promise);
            return promise;
        };

        return { loadPlans, get, query };
    });
