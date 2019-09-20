import { MIN_PAYPAL_AMOUNT, MAX_PAYPAL_AMOUNT } from '../../constants';
import { process } from '../helpers/paymentToken';

/* @ngInject */
function paypalView(Payment, notification) {
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

            const generateToken = async () => {
                try {
                    scope.$applyAsync(() => {
                        scope.loading = true;
                        scope.errorDetails = false;
                    });

                    const { Token, ApprovalURL } = await Payment.createToken({
                        Amount,
                        Currency,
                        Payment: {
                            Type: 'paypal'
                        }
                    });

                    scope.$applyAsync(() => {
                        scope.token = Token;
                        scope.approvalURL = ApprovalURL;
                        scope.loading = false;
                    });
                } catch (error) {
                    setLoading(false);
                }
            };

            scope.retry = () => generateToken();

            scope.openTab = async () => {
                try {
                    setLoading(true);
                    await process({ Token: scope.token, paymentApi: Payment, ApprovalURL: scope.approvalURL });
                    scope.paypalCallback({ Token: scope.token });
                    setLoading(false);
                } catch (error) {
                    setLoading(false);
                    error && error.message && notification.error(error.message);
                }
            };

            if (type === 'payment' && Amount < MIN_PAYPAL_AMOUNT) {
                scope.errorDetails = {
                    type: 'validator.amount',
                    validator: 'min',
                    amount: MIN_PAYPAL_AMOUNT
                };
            } else if (Amount > MAX_PAYPAL_AMOUNT) {
                scope.errorDetails = {
                    type: 'validator.amount',
                    validator: 'max',
                    amount: MAX_PAYPAL_AMOUNT
                };
            } else {
                generateToken();
            }
        }
    };
}
export default paypalView;
