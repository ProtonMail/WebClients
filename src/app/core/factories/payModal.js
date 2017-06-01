angular.module('proton.core')
.factory('payModal', (pmModal, Payment, notify, eventManager, gettextCatalog, aboutClient) => {
    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: 'templates/modals/pay.tpl.html',
        controller(params) {
            // Variables
            const self = this;
            self.amount = params.amount;
            self.amountDue = params.amountDue;
            self.credit = params.credit;
            self.currency = params.currency;
            self.methods = params.methods;
            self.invoice = params.invoice;
            self.choices = [];

            // Functions
            self.initialization = () => {
                if (self.amountDue > 0) {
                    if ((params.status.Stripe || params.status.Paymentwall) && self.methods.length > 0) {
                        self.method = self.methods[0];
                        self.choices.push({ value: 'card', label: gettextCatalog.getString('Credit card', null) });
                    }

                    if (params.status.Paypal && !aboutClient.isIE11()) { // IE11 doesn't support PayPal
                        self.choices.push({ value: 'paypal', label: 'PayPal' });
                    }

                    if (self.choices.length > 0) {
                        self.choice = self.choices[0];
                        self.changeChoice();
                    }
                }
            };

            self.label = (method) => '•••• •••• •••• ' + method.Details.Last4;

            self.submit = () => {
                const parameters = {
                    Amount: params.amountDue,
                    Currency: params.currency
                };

                if (self.amountDue > 0 && self.choice.value === 'card' && self.methods.length > 0) {
                    parameters.PaymentMethodID = self.method.ID;
                }

                Payment.pay(params.invoice.ID, parameters)
                .then((result) => {
                    if (result.data && result.data.Code === 1000) {
                        // manually fetch event log
                        eventManager.call();
                        params.close(true);
                    } else if (result.data && result.data.Error) {
                        notify({ message: result.data.Error, classes: 'notification-danger' });
                    }
                });
            };

            self.cancel = () => params.close();

            self.changeChoice = () => {
                if (self.choice.value === 'paypal') {
                    self.initPaypal();
                }
            };

            self.initPaypal = () => {
                Payment.paypal({
                    Amount: params.amountDue,
                    Currency: params.currency
                }).then((result) => {
                    if (result.data && result.data.Code === 1000) {
                        self.approvalURL = result.data.ApprovalURL;
                    } else if (result.data && result.data.Error) {
                        notify({ message: result.data.Error, classes: 'notification-danger' });
                    }
                });
            };

            self.openPaypalTab = () => {
                self.childWindow = window.open(self.approvalURL, 'PayPal');
                window.addEventListener('message', self.receivePaypalMessage, false);
            };

            self.receivePaypalMessage = (event) => {
                const origin = event.origin || event.originalEvent.origin; // For Chrome, the origin property is in the event.originalEvent object.

                if (origin !== 'https://secure.protonmail.com') {
                    return;
                }

                const { paymentID, payerID, cancel } = event.data;
                const paypalError = gettextCatalog.getString('Problem communicating with PayPal servers, please try again in a few minutes', null, 'Error');
                const promise = (cancel === '1') ? Promise.reject(paypalError) : Promise.resolve({ PayerID: payerID, PaymentID: paymentID, Cancel: cancel });

                promise
                    .then((details) => Payment.pay(params.invoice.ID, {
                        Amount: params.amountDue,
                        Currency: params.currency,
                        Payment: { Type: 'paypal', Details: details }
                    }))
                    .then(({ data = {} } = {}) => {
                        if (data.Code === 1000) {
                            return Promise.resolve();
                        }
                        throw new Error(data.Error);
                    })
                    .then(() => eventManager.call())
                    .then(() => params.close(true))
                    .catch((error) => notify({ message: error, classes: 'notification-danger' }));

                self.childWindow.close();
                window.removeEventListener('message', self.receivePaypalMessage, false);
            };

            self.initialization();
        }
    });
});
