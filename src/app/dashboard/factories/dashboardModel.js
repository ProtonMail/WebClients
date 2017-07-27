angular.module('proton.dashboard')
    .factory('dashboardModel', ($rootScope, confirmModal, CONSTANTS, downgrade, gettextCatalog, Payment, paymentModal, notify, subscriptionModel, networkActivityTracker, paymentModel) => {

        const PLANS_NAME = ['free', 'plus', 'professional', 'visionary'];
        const VPNS_NAME = ['vpnbasic', 'vpnplus'];
        const { PLUS, PROFESSIONAL, VISIONARY } = CONSTANTS.PLANS.PLAN;
        const { ADDRESS, MEMBER, DOMAIN, SPACE } = CONSTANTS.PLANS.ADDON;
        const YEARLY = 12;
        const MONTHLY = 1;
        const CACHE_PLAN = {};
        const CACHE_API = {};
        const CONFIGURATION = {
            currency: 'EUR',
            cycle: YEARLY,
            free: {}, // Store free addons
            plus: {}, // Store plus addons
            professional: {} // Store professional addons
        };
        const cycle = () => CONFIGURATION.cycle;
        const currency = () => CONFIGURATION.currency;
        const config = () => angular.copy(CONFIGURATION);

        const get = (key) => {
            const cache = angular.copy(CACHE_PLAN);
            return key ? cache[key] : cache;
        };

        const changeAddon = (plan, addon, value) => {
            CONFIGURATION[plan][addon] = value;
            $rootScope.$emit('dashboard', { type: 'addon.updated', data: { plan, addon, value } });
        };

        const query = (currency = 'USD', cycle = YEARLY) => {
            const key = `plans-${currency}-${cycle}`;
            const { Plans = [] } = CACHE_API[key] || {};

            return Plans;
        };

        /**
         * Get addon amount
         * @param  {Object}
         * @return {Integer}
         */
        const amount = ({ plan, addon, cycle = CONFIGURATION.cycle }) => {
            switch (addon) {
                case 'vpn':
                    return CACHE_PLAN[cycle].amounts[CONFIGURATION[plan].vpn];
                case 'address':
                    return CACHE_PLAN[cycle].amounts[ADDRESS] * CONFIGURATION[plan].address;
                case 'space':
                    return CACHE_PLAN[cycle].amounts[SPACE] * CONFIGURATION[plan].space;
                case 'domain':
                    return CACHE_PLAN[cycle].amounts[DOMAIN] * CONFIGURATION[plan].domain;
                case 'member':
                    return CACHE_PLAN[cycle].amounts[MEMBER] * CONFIGURATION[plan].member;
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

        const collectPlans = (plan) => {
            const plans = [];
            const cache = CACHE_PLAN[CONFIGURATION.cycle];

            switch (plan) {
                case 'free':
                    CONFIGURATION.free.vpn !== 'none' && plans.push(cache.vpn[CONFIGURATION.free.vpn]);
                    break;
                case 'plus':
                    plans.push(cache.plan[PLUS]);
                    _.times(CONFIGURATION.plus.space, () => plans.push(cache.addons[SPACE]));
                    _.times(CONFIGURATION.plus.address, () => plans.push(cache.addons[ADDRESS]));
                    _.times(CONFIGURATION.plus.domain, () => plans.push(cache.addons[DOMAIN]));
                    (CONFIGURATION.plus.vpn !== 'none') && plans.push(cache.vpn[CONFIGURATION.plus.vpn]);
                    break;
                case 'professional':
                    plans.push(cache.plan[PROFESSIONAL]);
                    _.times(CONFIGURATION.professional.member, () => plans.push(cache.addons[MEMBER]));
                    _.times(CONFIGURATION.professional.domain, () => plans.push(cache.addons[DOMAIN]));
                    (CONFIGURATION.professional.vpn !== 'none') && plans.push(cache.vpn[CONFIGURATION.professional.vpn]);
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
                Cycle: CONFIGURATION.cycle,
                Currency: CONFIGURATION.currency,
                PlanIDs,
                Coupon: subscriptionModel.coupon()
            })
                .then(({ data: valid = {} } = {}) => {
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
        const loadPlans = (Currency = CONFIGURATION.currency) => {
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
                    CONFIGURATION.currency = currency;
                    $rootScope.$emit('dashboard', { type: 'currency.updated', data: _.extend(data, { currency }) });
                });
        };

        const changeCycle = (cycle) => {
            CONFIGURATION.cycle = cycle;
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
                CONFIGURATION.currency = Currency;
                CONFIGURATION.cycle = Cycle;
                loadPlanCycle(Currency, Cycle)
                    .then(() => {
                        selectPlan(plan, 'paypal');
                    });
            }
        });

        return { init: angular.noop, loadPlans, get, query, currency, cycle, amount, total, config };
    });
