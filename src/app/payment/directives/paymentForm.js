import _ from 'lodash';

import { getPlansMap } from '../../../helpers/paymentHelper';
import { handlePaymentToken } from '../helpers/paymentToken';

/* @ngInject */
function paymentForm(
    dispatchers,
    eventManager,
    cardModel,
    paymentModel,
    Payment,
    paymentUtils,
    paymentModalModel,
    networkActivityTracker,
    paymentVerificationModal
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

            const MODEL = {};

            ctrl.isBlackFriday = !!params.isBlackFriday;

            ctrl.card = {};
            ctrl.cancel = params.cancel;
            ctrl.valid = params.valid;
            ctrl.displayGift = false;

            if (params.valid.Coupon) {
                ctrl.displayCoupon = true;
                ctrl.coupon = params.valid.Coupon.Code;
                MODEL.coupon = ctrl.coupon;
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

            const getCodes = () => {
                // Use the value of whatever we are applying, otherwise the latest valid value confirmed by the API.
                const coupon = ctrl.coupon || MODEL.coupon;
                const gift = ctrl.gift || MODEL.gift;

                return [gift, coupon].filter(Boolean);
            };

            const getParameters = () => {
                const parameters = {
                    Amount: ctrl.valid.AmountDue,
                    Cycle: ctrl.valid.Cycle,
                    Currency: ctrl.valid.Currency,
                    Codes: getCodes(),
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
                        Type: 'token',
                        Details: ctrl.paypalConfig
                    };
                }

                return handlePaymentToken({ params: parameters, paymentApi: Payment, paymentVerificationModal });
            };

            const finish = () => {
                ctrl.step = 'thanks';
                dispatch('process.success');
            };

            const paymentRequest = async () => {
                const parameters = await getParameters();
                await paymentModel.subscribe(parameters);
                return eventManager.call();
            };

            ctrl.submit = () => {
                ctrl.step = 'process';
                const promise = paymentRequest()
                    .then(() => finish())
                    .catch((error) => {
                        ctrl.step = 'payment';
                        throw error;
                    });
                networkActivityTracker.track(promise);
            };

            function getAddParameters() {
                const Codes = getCodes();
                const parameters = {
                    Currency: params.valid.Currency,
                    Cycle: params.valid.Cycle,
                    PlanIDs: params.planIDs,
                    Codes
                };

                return parameters;
            }

            const apply = () => {
                const parameters = getAddParameters();

                return paymentModel
                    .add(parameters)
                    .then((data) => (ctrl.valid = data))
                    .then(() => {
                        dispatch('payment.change', ctrl.valid);

                        const CouponCode = ctrl.valid.Coupon && ctrl.valid.Coupon.Code;

                        // Update latest valid values.
                        MODEL.gift = ctrl.gift || MODEL.gift;
                        MODEL.coupon = ctrl.coupon || MODEL.coupon;

                        const { list, selected } = paymentUtils.generateMethods({
                            choice: ctrl.method.value,
                            Cycle: ctrl.valid.Cycle,
                            Amount: ctrl.valid.AmountDue,
                            CouponCode
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

                const action = target.dataset.action;
                if (action === 'gift' || action === 'coupon') {
                    apply(action);
                }
            };

            el.on('click', onClick);

            scope.$on('$destroy', () => {
                el.off('click', onClick);
            });
        }
    };
}
export default paymentForm;
