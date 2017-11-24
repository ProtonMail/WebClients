angular.module('proton.payment')
    .directive('paypalView', (notification, Payment, gettextCatalog, CONSTANTS, $q, networkUtils) => {

        const { MIN_PAYPAL_AMOUNT, MAX_PAYPAL_AMOUNT, CANCEL_REQUEST } = CONSTANTS;
        const I18N = {
            down: gettextCatalog.getString('Error connecting to PayPal.', null, 'Paypal component')
        };

        return {
            replace: true,
            restrict: 'E',
            templateUrl: 'templates/payment/paypalView.tpl.html',
            scope: {
                amount: '=',
                currency: '=',
                paypalCallback: '=callback'
            },
            link(scope, element, { type = 'payment' }) {
                let childWindow;
                let deferred;

                const load = () => {
                    scope.errorDetails = null;
                    scope.paypalNetworkError = false;
                    const Amount = scope.amount;

                    if (type === 'payment' && Amount < MIN_PAYPAL_AMOUNT) {
                        return scope.errorDetails = {
                            type: 'validator.amount',
                            validator: 'min',
                            amount: MIN_PAYPAL_AMOUNT
                        };
                    }

                    if (Amount > MAX_PAYPAL_AMOUNT) {
                        return scope.errorDetails = {
                            type: 'validator.amount',
                            validator: 'max',
                            amount: MAX_PAYPAL_AMOUNT
                        };
                    }

                    deferred = $q.defer();
                    Payment.paypal({ Amount, Currency: scope.currency }, { timeout: deferred.promise })
                        .then(({ data = {} } = {}) => {
                            deferred = null;

                            if (data.Code === 1000) {
                                return data;
                            }
                            if (data.Code === 22802) {
                                scope.paypalNetworkError = true;
                            }
                            throw new Error(I18N.down);
                        })
                        .then(({ ApprovalURL }) => scope.approvalURL = ApprovalURL)
                        .catch((error) => {
                            const { data = {} } = error;

                            deferred = null;
                            if (!networkUtils.isCancelledRequest(error)) {
                                error.message && notification.error(error);
                                data.Error && notification.error(data.Error);
                            }
                        });
                };

                scope.openPaypalTab = () => {
                    childWindow = window.open(scope.approvalURL, 'PayPal');
                    window.addEventListener('message', receivePaypalMessage, false);
                };

                function receivePaypalMessage(event) {
                    const origin = event.origin || event.originalEvent.origin; // For Chrome, the origin property is in the event.originalEvent object.

                    if (origin !== 'https://secure.protonmail.com') {
                        return;
                    }

                    const { payerID: PayerID, paymentID: PaymentID, cancel: Cancel } = event.data;

                    childWindow.close();
                    window.removeEventListener('message', receivePaypalMessage, false);
                    scope.paypalCallback({ PayerID, PaymentID, Cancel });
                }

                load();

                scope.$on('$destroy', () => {
                    // Cancel request if pending
                    deferred && deferred.resolve(CANCEL_REQUEST);
                    deferred = null;
                });
            }
        };
    });
