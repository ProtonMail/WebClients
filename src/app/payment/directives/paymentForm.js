import _ from 'lodash';

import { getPlansMap } from '../../../helpers/paymentHelper';

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

            const PLANS_MAP = getPlansMap(params.plans, 'ID');

            ctrl.planIDs = params.planIDs;
            ctrl.plans = Object.keys(params.planIDs).map((ID) => PLANS_MAP[ID]);
            ctrl.step = 'payment';

            const { list, selected } = paymentUtils.generateMethods({
                choice: params.choice,
                Cycle: params.valid.Cycle,
                Amount: params.valid.AmountDue,
                CouponCode: params.valid.Coupon && params.valid.Coupon.Code
            });
            ctrl.methods = list;
            ctrl.method = selected;
            ctrl.status = paymentModel.get('status'); // move out

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
                    PlanIDs: ctrl.planIDs
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
                    PlanIDs: params.planIDs
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

                        const { list, selected } = paymentUtils.generateMethods({
                            choice: ctrl.method.value,
                            Cycle: ctrl.valid.Cycle,
                            Amount: ctrl.valid.AmountDue,
                            CouponCode: ctrl.valid.Coupon && ctrl.valid.Coupon.Code
                        });

                        ctrl.methods = list;
                        ctrl.method = selected;

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
