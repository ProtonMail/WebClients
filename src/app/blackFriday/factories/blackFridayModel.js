import _ from 'lodash';

/* @ngInject */
function blackFridayModel(
    $rootScope,
    authentication,
    CONSTANTS,
    dashboardModel,
    networkActivityTracker,
    Payment,
    paymentModal,
    subscriptionModel,
    paymentModel
) {
    const { PAID_MEMBER_ROLE, CYCLE, PLANS, BLACK_FRIDAY_INTERVAL } = CONSTANTS;
    const { TWO_YEARS } = CYCLE;
    const { PLUS, VPN_PLUS } = PLANS.PLAN;
    const CACHE = {};
    const BLACK_FRIDAY_ITEM = 'protonmail_black_friday';
    const inInterval = () => moment().isBetween('2017-11-24', '2017-11-28');

    function isBlackFridayPeriod(force = false) {
        const subscription = subscriptionModel.get();
        const isLifetime = subscription.CouponCode === 'LIFETIME';
        const isMember = authentication.user.Role === PAID_MEMBER_ROLE;
        const isSubuser = authentication.user.subuser;
        const isTwoYears = subscription.Cycle === TWO_YEARS;

        // No black friday for lifetime users
        if (isLifetime) {
            return false;
        }

        // No black friday for member or subuser
        if (isMember || isSubuser) {
            return false;
        }

        // Don't show again the black friday for two years user
        if (isTwoYears) {
            return false;
        }

        // Check token saved in localStorage
        if (!force && localStorage.getItem(BLACK_FRIDAY_ITEM)) {
            return false;
        }

        return inInterval();
    }

    function loadPlanIDs(plan = 'current') {
        return dashboardModel.fetchPlans(CACHE.currency, TWO_YEARS).then(({ Plans = [] } = {}) => {
            const PlanIDs = [];
            const MAP_PLAN_ID = _.reduce(
                Plans,
                (acc, { Name, ID }) => {
                    acc[Name] = ID;
                    return acc;
                },
                {}
            );

            if (plan === PLUS) {
                PlanIDs.push(MAP_PLAN_ID[PLUS]);
            }

            if (plan === VPN_PLUS) {
                PlanIDs.push(MAP_PLAN_ID[VPN_PLUS]);
            }

            if (plan === `${PLUS}+${VPN_PLUS}`) {
                PlanIDs.push(MAP_PLAN_ID[PLUS], MAP_PLAN_ID[VPN_PLUS]);
            }

            if (plan === 'current') {
                const subscription = subscriptionModel.get();

                PlanIDs.push(...subscription.Plans.map(({ Name }) => MAP_PLAN_ID[Name]));
            }

            return PlanIDs;
        });
    }

    function buy({ plan = 'current' }) {
        const promise = loadPlanIDs(plan).then((PlanIDs) => {
            return Payment.valid({ Cycle: TWO_YEARS, Currency: CACHE.currency, PlanIDs, CouponCode: subscriptionModel.coupon() })
                .then(({ data: valid = {} } = {}) => {
                    paymentModal.activate({
                        params: {
                            planIDs: PlanIDs,
                            valid,
                            cancel() {
                                paymentModal.deactivate();
                            }
                        }
                    });
                })
                .catch(({ data = {} } = {}) => {
                    throw Error(data.Error);
                });
        });

        networkActivityTracker.track(promise);
    }

    function set(key, value) {
        CACHE[key] = value;
    }

    function saveClose() {
        localStorage.setItem(BLACK_FRIDAY_ITEM, 'closed');
    }

    function load() {
        Promise.all([paymentModel.getMethods(), paymentModel.getStatus()]).then(() => $rootScope.$emit('blackFriday', { type: 'loaded' }));
    }

    setInterval(() => {
        $rootScope.$emit('blackFriday', { type: 'tictac' });
    }, BLACK_FRIDAY_INTERVAL);

    $rootScope.$on('blackFriday', (event, { type = '', data = {} }) => {
        type === 'buy' && buy(data);
        type === 'load' && load();
    });

    return { init: angular.noop, isBlackFridayPeriod, set, saveClose, inInterval };
}
export default blackFridayModel;
