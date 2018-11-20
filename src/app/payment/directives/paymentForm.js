import _ from 'lodash';

import { PLANS_TYPE } from '../../constants';

/* @ngInject */
function paymentForm(
    dispatchers,
    notification,
    eventManager,
    cardModel,
    paymentModel,
    paymentUtils,
    dashboardModel,
    paymentModalModel
) {
    const { dispatcher } = dispatchers(['modal.payment']);
    const disp = (plan) => (type, data = {}) => {
        dispatcher['modal.payment'](type, _.extend({ plan }, data));
    };

    const formatPlanIDs = (planIDs = []) => _.countBy(planIDs, (planID) => planID);

    /**
     * Extract the name of the addon, ex 1gb -> space
     * to have human friendly keys for the template
     * @param  {String} name Addon's name
     * @return {String}
     */
    const getTypeAddon = (name) => {
        const [, match] = name.match(/\d+(\w+)/) || [];
        if (match === 'gb') {
            return 'space';
        }
        return match;
    };

    const updateKey = (acc, key, value = 0) => (acc[key] = acc[key] ? acc[key] + value : value);

    const formatPlanMap = (plans = []) => {
        return plans.reduce((acc, plan) => {
            if (plan.ID) {
                // ID is not defined for free
                acc[plan.ID] = plan;
            }
            return acc;
        }, Object.create(null));
    };

    const getPlanTotal = (list, map) => {
        const plans = list.map((ID) => map[ID]);

        // Compute how many addons
        const total = plans.reduce((acc, plan) => {
            updateKey(acc, 'MaxSpace', plan.MaxSpace);
            updateKey(acc, 'MaxMembers', plan.MaxMembers);
            updateKey(acc, 'MaxDomains', plan.MaxDomains);
            updateKey(acc, 'MaxAddresses', plan.MaxAddresses);
            updateKey(acc, 'MaxVPN', plan.MaxVPN);
            return acc;
        }, Object.create(null));

        // Compute price /addon
        const price = plans
            .filter(({ Type }) => Type === PLANS_TYPE.ADDON)
            .reduce(
                (acc, { Name, Amount }) => {
                    const type = getTypeAddon(Name);
                    updateKey(acc, type, Amount);
                    return acc;
                },
                { space: 0, member: 0, domain: 0, address: 0, vpn: 0 }
            );

        return { total, price };
    };

    return {
        scope: {
            ctrl: '=',
            form: '='
        },
        replace: true,
        templateUrl: require('../../../templates/payment/paymentForm.tpl.html'),
        link(scope, el) {
            const ctrl = scope.ctrl;
            const params = paymentModalModel.get();
            const dispatch = disp(params.plan);

            ctrl.isBlackFriday = !!params.isBlackFriday;

            ctrl.card = {};
            ctrl.cancel = params.cancel;
            ctrl.valid = params.valid;
            ctrl.displayGift = false;

            if (params.valid.Coupon) {
                ctrl.displayCoupon = true;
                ctrl.coupon = params.valid.Coupon.Code;
            }

            // @todo Improve the API to provide a CACHE ˜= labelsModel
            const planList = dashboardModel.query(params.valid.Currency, params.valid.Cycle);

            const PLANS_MAP = formatPlanMap(planList);
            const MAP_TOTAL = getPlanTotal(params.planIDs, PLANS_MAP);

            ctrl.planIDs = params.planIDs;
            ctrl.plans = _.uniq(params.planIDs).map((ID) => PLANS_MAP[ID]);
            ctrl.step = 'payment';

            const { list, selected } = paymentUtils.generateMethods({
                choice: params.choice,
                Cycle: params.valid.Cycle,
                Amount: params.valid.AmountDue
            });
            ctrl.methods = list;
            ctrl.method = selected;
            ctrl.status = paymentModel.get('status'); // move out

            ctrl.count = (type) => MAP_TOTAL.total[type];
            ctrl.price = (type) => MAP_TOTAL.price[type];

            ctrl.paypalCallback = (config) => {
                ctrl.paypalConfig = config;
                ctrl.submit();
            };

            const getParameters = () => {
                const parameters = {
                    Amount: ctrl.valid.AmountDue,
                    Cycle: ctrl.valid.Cycle,
                    Currency: ctrl.valid.Currency,
                    CouponCode: ctrl.coupon,
                    GiftCode: ctrl.gift,
                    PlanIDs: formatPlanIDs(params.planIDs)
                };

                if (!ctrl.valid.AmountDue) {
                    return parameters;
                }

                if (ctrl.method.value === 'use.card') {
                    parameters.PaymentMethodID = ctrl.method.ID;
                }

                if (ctrl.method.value === 'card') {
                    parameters.Payment = {
                        Type: 'card',
                        Details: cardModel(ctrl.card).details()
                    };
                }

                if (ctrl.method.value === 'paypal') {
                    parameters.Payment = {
                        Type: 'paypal',
                        Details: ctrl.paypalConfig
                    };
                }

                return parameters;
            };

            const finish = () => {
                ctrl.step = 'thanks';
                dispatch('process.success');
            };

            ctrl.submit = () => {
                ctrl.step = 'process';

                paymentModel
                    .subscribe(getParameters())
                    .then(eventManager.call)
                    .then(finish)
                    .catch(() => {
                        ctrl.step = 'payment';
                    });
            };

            function getAddParameters(thing) {
                const parameters = {
                    Currency: params.valid.Currency,
                    Cycle: params.valid.Cycle,
                    PlanIDs: formatPlanIDs(params.planIDs)
                };

                if (thing === 'coupon') {
                    parameters.CouponCode = ctrl.coupon;
                }

                if (thing === 'gift') {
                    parameters.GiftCode = ctrl.gift;
                }

                return parameters;
            }

            const apply = (thing = 'coupon') => {
                return paymentModel
                    .add(getAddParameters(thing))
                    .then((data) => (ctrl.valid = data))
                    .then(() => {
                        dispatch('payment.change', ctrl.valid);

                        // If the amount due is null we select the first choice to display the submit button
                        if (!ctrl.valid.AmountDue) {
                            return (ctrl.method = ctrl.methods[0]);
                        }
                        // If the current payment method is 'paypal' or 'bitcoin' we need to reload the component to match with the new amount
                        if (ctrl.method.value === 'paypal' || ctrl.method.value === 'bitcoin') {
                            const currentMethod = ctrl.method.value;

                            ctrl.method.value = '';

                            _rAF(() => {
                                scope.$applyAsync(() => {
                                    ctrl.method.value = currentMethod;
                                });
                            });
                        }
                    });
            };

            const onClick = ({ target }) => {
                if (target.classList.contains('paymentForm-btn-payAnnualy')) {
                    dispatch('switch', {
                        type: 'cycle',
                        Currency: params.valid.Currency,
                        Cycle: 12
                    });
                }
            };

            const onSubmit = (e) => {
                if (e.target.name === 'couponForm' || e.target.name === 'giftForm') {
                    e.preventDefault();
                    e.stopPropagation();
                    apply(e.target.name === 'couponForm' ? 'coupon' : 'gift');
                }
            };

            el.on('click', onClick);
            el.on('submit', onSubmit);

            scope.$on('$destroy', () => {
                el.off('click', onClick);
                el.off('submit', onSubmit);
            });
        }
    };
}
export default paymentForm;
