import { MIN_PAYPAL_AMOUNT, MAX_PAYPAL_AMOUNT } from '../../constants';
import { handlePaymentToken } from '../helpers/paymentToken';

/* @ngInject */
function paypalView(Payment, notification, paymentVerificationModal) {
    return {
        replace: true,
        restrict: 'E',
        templateUrl: require('../../../templates/payment/paypalView.tpl.html'),
        scope: {
            amount: '=',
            currency: '=',
            paypalCallback: '=callback'
        },
        link(scope, element, { type = 'payment' }) {
            const Amount = scope.amount;
            const Currency = scope.currency;
            const setLoading = (status) => scope.$applyAsync(() => (scope.loading = status));

            if (type === 'payment' && Amount < MIN_PAYPAL_AMOUNT) {
                scope.errorDetails = {
                    type: 'validator.amount',
                    validator: 'min',
                    amount: MIN_PAYPAL_AMOUNT
                };
            }

            if (Amount > MAX_PAYPAL_AMOUNT) {
                scope.errorDetails = {
                    type: 'validator.amount',
                    validator: 'max',
                    amount: MAX_PAYPAL_AMOUNT
                };
            }

            scope.openTab = async () => {
                try {
                    setLoading(true);
                    const requestBody = await handlePaymentToken({
                        params: {
                            Amount,
                            Currency,
                            Payment: {
                                Type: 'paypal'
                            }
                        },
                        paymentApi: Payment,
                        paymentVerificationModal
                    });
                    const { Token = '' } = requestBody.Payment.Details;
                    scope.paypalCallback({ Token });
                    setLoading(false);
                } catch (error) {
                    setLoading(false);
                    error && error.message && notification.error(error.message);
                }
            };
        }
    };
}
export default paypalView;
