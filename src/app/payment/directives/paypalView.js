import { MIN_PAYPAL_AMOUNT, MAX_PAYPAL_AMOUNT } from '../../constants';
import { process } from '../helpers/paymentToken';
import { isBrowserWithout3DS } from '../../../helpers/browser';

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

            scope.isDonation = type === 'donation';
            scope.isUpdate = type === 'update';

            const generateTokens = async () => {
                try {
                    scope.$applyAsync(() => {
                        scope.loadingTokens = true;
                        scope.errorDetails = false;
                    });

                    const paypalResult = await Payment.createToken({
                        Amount,
                        Currency,
                        Payment: {
                            Type: 'paypal'
                        }
                    });

                    const paypalCreditResult = await Payment.createToken({
                        Amount,
                        Currency,
                        Payment: {
                            Type: 'paypal-credit'
                        }
                    });

                    scope.$applyAsync(() => {
                        scope.paypalModel = paypalResult;
                        scope.paypalCreditModel = paypalCreditResult;
                        scope.loadingTokens = false;
                    });
                } catch (error) {
                    scope.$applyAsync(() => {
                        scope.loadingTokens = false;
                        scope.errorDetails = { validator: 'tokens' };
                        delete scope.paypalModel;
                        delete scope.paypalCreditModel;
                    });
                }
            };

            scope.retry = () => generateTokens();

            scope.openTab = async ({ Token, ReturnHost, ApprovalURL }) => {
                try {
                    scope.$applyAsync(() => {
                        scope.loadingVerification = true;
                    });
                    await process({
                        Token,
                        ReturnHost,
                        ApprovalURL,
                        paymentApi: Payment
                    });
                    scope.paypalCallback({ Token });
                    scope.$applyAsync(() => {
                        scope.loadingVerification = false;
                    });
                } catch (error) {
                    scope.$applyAsync(() => {
                        scope.loadingVerification = false;
                    });
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
            } else if (isBrowserWithout3DS()) {
                scope.errorDetails = {
                    validator: 'duckduckgo'
                };
            } else {
                generateTokens();
            }
        }
    };
}
export default paypalView;
