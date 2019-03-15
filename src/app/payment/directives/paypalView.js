import { parseURL } from '../../../helpers/browser';
import { MIN_PAYPAL_AMOUNT, MAX_PAYPAL_AMOUNT, CANCEL_REQUEST } from '../../constants';
import { API_CUSTOM_ERROR_CODES } from '../../errors';

const { PAYMENTS_PAYPAL_CONNECTION_EXCEPTION } = API_CUSTOM_ERROR_CODES;

/* @ngInject */
function paypalView(notification, Payment, $q, networkUtils, windowModel) {

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
            let deferred;

            const resetWindow = () => {
                windowModel.reset('paypal');
                window.removeEventListener('message', receivePaypalMessage, false);
            };

            const load = () => {
                scope.errorDetails = null;
                scope.paypalNetworkError = false;
                const Amount = scope.amount;

                if (type === 'payment' && Amount < MIN_PAYPAL_AMOUNT) {
                    return (scope.errorDetails = {
                        type: 'validator.amount',
                        validator: 'min',
                        amount: MIN_PAYPAL_AMOUNT
                    });
                }

                if (Amount > MAX_PAYPAL_AMOUNT) {
                    return (scope.errorDetails = {
                        type: 'validator.amount',
                        validator: 'max',
                        amount: MAX_PAYPAL_AMOUNT
                    });
                }

                deferred = $q.defer();
                Payment.paypal({ Amount, Currency: scope.currency }, { timeout: deferred.promise })
                    .then(({ data = {} } = {}) => {
                        deferred = null;
                        return data;
                    })
                    .then(({ ApprovalURL }) => (scope.approvalURL = ApprovalURL))
                    .catch((error) => {
                        if (networkUtils.isCancelledRequest(error)) {
                            return;
                        }

                        const { data = {} } = error;

                        if (data.Code === PAYMENTS_PAYPAL_CONNECTION_EXCEPTION) {
                            scope.paypalNetworkError = true;
                        } else {
                            scope.errorDetails = {};
                        }

                        deferred = null;

                        throw error;
                    });
            };

            scope.openPaypalTab = () => {
                resetWindow();
                windowModel.add({
                    type: 'paypal',
                    win: window.open(scope.approvalURL, 'PayPal'),
                    unsubscribe() {
                        window.removeEventListener('message', receivePaypalMessage, false);
                    }
                });
                window.addEventListener('message', receivePaypalMessage, false);
            };

            function receivePaypalMessage(event) {
                const origin = event.origin || event.originalEvent.origin; // For Chrome, the origin property is in the event.originalEvent object.

                if (origin !== 'https://secure.protonmail.com') {
                    return;
                }

                const { payerID: PayerID, paymentID: PaymentID, cancel: Cancel, token } = event.data;
                const { searchObject = {} } = parseURL(scope.approvalURL);

                if (token !== searchObject.token) {
                    return;
                }

                resetWindow();
                scope.paypalCallback({ PayerID, PaymentID, Cancel });
            }

            load();

            // Needed for error handler to retry.
            scope.initPaypal = load;

            scope.$on('$destroy', () => {
                // Cancel request if pending
                deferred && deferred.resolve(CANCEL_REQUEST);
                deferred = null;
                windowModel.reset('paypal');
            });
        }
    };
}
export default paypalView;
