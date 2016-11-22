angular.module('proton.core')
.directive('paypalView', (notify, Payment) => {
    return {
        replace: true,
        restrict: 'E',
        templateUrl: 'templates/directives/core/paypalView.tpl.html',
        scope: {
            amount: '=',
            currency: '='
        },
        link(scope) {
            let childWindow;
            scope.initPaypal = () => {
                console.log('initialization', scope.amount, scope.currency);
                scope.paypalNetworkError = false;
                Payment.paypal({ Amount: scope.amount, Currency: scope.currency })
                .then((result = {}) => {
                    console.log(result);
                    const { data = {} } = result;
                    if (data.Code === 1000) {
                        if (data.ApprovalURL) {
                            scope.approvalURL = data.ApprovalURL;
                        }
                    } else if (data.Code === 22802) {
                        scope.paypalNetworkError = true;
                    } else if (data.Error) {
                        notify({ message: Error, classes: 'notification-danger' });
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

                const paypalObject = event.data;

                // we need to capitalize some stuff
                if (paypalObject.payerID && paypalObject.paymentID) {
                    paypalObject.PayerID = paypalObject.payerID;
                    paypalObject.PaymentID = paypalObject.paymentID;

                    // delete unused
                    delete paypalObject.payerID;
                    delete paypalObject.paymentID;
                }

                childWindow.close();
                window.removeEventListener('message', receivePaypalMessage, false);
            }
            scope.initPaypal();
        }
    };
});
