angular.module('proton.dashboard')
    .factory('dashboardModel', ($rootScope, confirmModal, CONSTANTS, dashboardConfiguration, downgrade, gettextCatalog, Payment, paymentModal, subscriptionModel, networkActivityTracker, paymentModel) => {

        const PLANS_NAME = ['free', 'plus', 'professional', 'visionary'];
        const VPNS_NAME = ['vpnbasic', 'vpnplus'];
        const { PLUS, PROFESSIONAL, VISIONARY } = CONSTANTS.PLANS.PLAN;
        const { ADDRESS, MEMBER, DOMAIN, SPACE } = CONSTANTS.PLANS.ADDON;
        const YEARLY = 12;
        const MONTHLY = 1;
        const CACHE_PLAN = {};
        const CACHE_API = {};

        const get = (key) => {
            const cache = angular.copy(CACHE_PLAN);
            return key ? cache[key] : cache;
        };

        const changeAddon = (plan, addon, value) => {
            dashboardConfiguration.addon(plan, addon, value);
            $rootScope.$emit('dashboard', { type: 'addon.updated', data: { plan, addon, value } });
        };

        const query = (currency = 'USD', cycle = YEARLY) => {
            const key = `plans-${currency}-${cycle}`;
            const { Plans = [] } = CACHE_API[key] || {};

            return Plans;
        };

        const collectPlans = (plan) => {
            const plans = [];
            const cache = CACHE_PLAN[dashboardConfiguration.cycle()];
            const config = dashboardConfiguration.get();

            switch (plan) {
                case 'free':
                    config.free.vpn !== 'none' && plans.push(cache.vpn[config.free.vpn]);
                    break;
                case 'plus':
                    plans.push(cache.plan[PLUS]);
                    _.times(config.plus.space, () => plans.push(cache.addons[SPACE]));
                    _.times(config.plus.address, () => plans.push(cache.addons[ADDRESS]));
                    _.times(config.plus.domain, () => plans.push(cache.addons[DOMAIN]));
                    (config.plus.vpn !== 'none') && plans.push(cache.vpn[config.plus.vpn]);
                    break;
                case 'professional':
                    plans.push(cache.plan[PROFESSIONAL]);
                    _.times(config.professional.member, () => plans.push(cache.addons[MEMBER]));
                    _.times(config.professional.domain, () => plans.push(cache.addons[DOMAIN]));
                    (config.professional.vpn !== 'none') && plans.push(cache.vpn[config.professional.vpn]);
                    break;
                case 'visionary':
                    plans.push(cache.plan[VISIONARY]);
                    break;
            }

            return plans;
        };

        const selectPlan = (plan, choice) => {
            const plans = collectPlans(plan);

            if (plan === 'free' && !plans.length) {
                return downgrade();
            }

            const PlanIDs = _.pluck(plans, 'ID'); // Map plan IDs
            const promise = Payment.valid({
                Cycle: dashboardConfiguration.cycle(),
                Currency: dashboardConfiguration.currency(),
                PlanIDs,
                Coupon: subscriptionModel.coupon()
            })
                .then(({ data: valid = {} } = {}) => {

                    if (valid.Error) {
                        throw new Error(valid.Error);
                    }

                    paymentModal.activate({
                        params: {
                            planIDs: PlanIDs,
                            valid, choice, plan,
                            cancel() {
                                paymentModal.deactivate();
                            }
                        }
                    });

                });

            networkActivityTracker.track(promise);
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
         *  And a map between Name and Amount
         * @param  {String} currency
         * @param  {Number} cycle
         * @return {Promise}
         */
        const loadPlanCycle = (currency, cycle = YEARLY) => {
            return fetchPlans(currency, cycle)
                .then((data = {}) => {
                    const { list, addons, vpn, plan, amounts } = (data.Plans || []).reduce((acc, plan) => {
                        acc.amounts[plan.Name] = plan.Amount;

                        if (VPNS_NAME.indexOf(plan.Name) > -1) {
                            acc.vpn[plan.Name] = plan;
                            return acc;
                        }

                        if (PLANS_NAME.indexOf(plan.Name) > -1) {
                            acc.plan[plan.Name] = plan;
                            acc.list.push(plan);
                            return acc;
                        }

                        if ([ADDRESS, MEMBER, DOMAIN, SPACE].indexOf(plan.Name) > -1) {
                            acc.addons[plan.Name] = plan;
                            return acc;
                        }

                        return acc;
                    }, { addons: {}, plan: {}, vpn: {}, list: [], amounts: { none: 0 } });

                    return { list, addons, vpn, plan, amounts };
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
        const loadPlans = (Currency = dashboardConfiguration.currency()) => {
            const promise = Promise.all([ loadPlanCycle(Currency), loadPlanCycle(Currency, MONTHLY) ])
                .then(([ yearly, monthly ]) => {
                    CACHE_PLAN[YEARLY] = angular.copy(yearly);
                    CACHE_PLAN[MONTHLY] = angular.copy(monthly);

                    return angular.copy(CACHE_PLAN);
                });

            networkActivityTracker.track(promise);

            return promise;
        };

        const changeCurrency = (currency) => {
            loadPlans(currency)
                .then((data) => {
                    dashboardConfiguration.set('currency', currency);
                    $rootScope.$emit('dashboard', { type: 'currency.updated', data: _.extend(data, { currency }) });
                });
        };

        /**
         * Get amounts for each plans
         * @param  {Number} cycle
         * @return {Object}
         */
        const amounts = (cycle = dashboardConfiguration.cycle()) => angular.copy(CACHE_PLAN[cycle].amounts);

        /**
         * Get addon amount for the current dashboard configuration
         * @param  {Object}
         * @return {Integer}
         */
        const amount = ({ plan, addon, cycle = dashboardConfiguration.cycle() }) => {
            const config = dashboardConfiguration.get();

            switch (addon) {
                case 'vpn':
                    return CACHE_PLAN[cycle].amounts[config[plan].vpn];
                case 'address':
                    return CACHE_PLAN[cycle].amounts[ADDRESS] * config[plan].address;
                case 'space':
                    return CACHE_PLAN[cycle].amounts[SPACE] * config[plan].space;
                case 'domain':
                    return CACHE_PLAN[cycle].amounts[DOMAIN] * config[plan].domain;
                case 'member':
                    return CACHE_PLAN[cycle].amounts[MEMBER] * config[plan].member;
            }

            switch (plan) {
                case 'plus':
                    return CACHE_PLAN[cycle].amounts.plus;
                case 'professional':
                    return CACHE_PLAN[cycle].amounts.professional;
                case 'visionary':
                    return CACHE_PLAN[cycle].amounts.visionary;
                default:
                    return 0;
            }
        };

        /**
         * Get plan total
         * @param  {[type]} plan  [description]
         * @param  {[type]} cycle [description]
         * @return {[type]}       [description]
         */
        const total = (plan, cycle) => {
            let result = 0;

            switch (plan) {
                case 'free':
                    result += amount({ plan, cycle, addon: 'vpn' });
                    break;
                case 'plus':
                    result += amount({ plan, cycle });
                    result += amount({ plan, cycle, addon: 'address' });
                    result += amount({ plan, cycle, addon: 'space' });
                    result += amount({ plan, cycle, addon: 'domain' });
                    result += amount({ plan, cycle, addon: 'vpn' });
                    break;
                case 'professional':
                    result += amount({ plan, cycle });
                    result += amount({ plan, cycle, addon: 'member' });
                    result += amount({ plan, cycle, addon: 'domain' });
                    result += amount({ plan, cycle, addon: 'vpn' });
                    break;
                case 'visionary':
                    result += amount({ plan: 'visionary', cycle });
                    break;
            }

            return result;
        };

        const changeCycle = (cycle) => {
            dashboardConfiguration.set('cycle', cycle);
            $rootScope.$emit('dashboard', { type: 'cycle.updated', data: { cycle } });
        };

        $rootScope.$on('dashboard', (event, { type, data = {} }) => {
            (type === 'change.cycle') && changeCycle(data.cycle);
            (type === 'change.currency') && changeCurrency(data.currency);
            (type === 'change.addon') && changeAddon(data.plan, data.addon, data.value);
            (type === 'select.plan') && selectPlan(data.plan);
        });

        $rootScope.$on('modal.payment', (e, { type, data }) => {
            if (type === 'process.success') {
                const promise = Promise.all([
                    subscriptionModel.fetch(),
                    paymentModel.getMethods(true)
                ]);
                networkActivityTracker.track(promise);
            }

            if (type === 'switch') {
                const { Cycle, Currency, plan } = data;

                paymentModal.deactivate();
                dashboardConfiguration.set('currency', Currency);
                dashboardConfiguration.set('cycle', Cycle);

                loadPlanCycle(Currency, Cycle)
                    .then(() => {
                        selectPlan(plan, 'paypal');
                    });
            }
        });

        return { init: angular.noop, loadPlans, get, query, amount, amounts, total };
    });
