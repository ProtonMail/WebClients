angular.module('proton.core')
.directive('paypalView', (notify, Payment, gettextCatalog) => {
    return {
        replace: true,
        restrict: 'E',
        templateUrl: 'templates/directives/core/paypalView.tpl.html',
        scope: {
            amount: '=',
            currency: '=',
            paypalCallback: '=callback'
        },
        link(scope) {
            let childWindow;

            scope.initPaypal = () => {
                scope.paypalNetworkError = false;
                Payment.paypal({ Amount: scope.amount * 100, Currency: scope.currency })
                    .then(({ data = {} } = {}) => {
                        if (data.Code === 1000) {
                            return Promise.resolve(data);
                        }
                        if (data.Code === 22802) {
                            scope.paypalNetworkError = true;
                        }
                        throw new Error(data.Error || gettextCatalog.getString('Error connecting to PayPal.', null));
                    })
                    .then(({ ApprovalURL }) => scope.approvalURL = ApprovalURL)
                    .catch((error) => notify({ message: error, classes: 'notification-danger' }));
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

                const { payerID, paymentID } = event.data;

                childWindow.close();
                window.removeEventListener('message', receivePaypalMessage, false);
                scope.paypalCallback({ PayerID: payerID, PaymentID: paymentID });
            }

            scope.initPaypal();
        }
    };
});
