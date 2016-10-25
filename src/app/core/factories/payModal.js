angular.module('proton.core')
.factory('payModal', (pmModal, Payment, notify, eventManager, gettextCatalog) => {
    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: 'templates/modals/pay.tpl.html',
        controller(params) {
            // Variables
            this.amount = params.amount;
            this.amountDue = params.amountDue;
            this.credit = params.credit;
            this.currency = params.currency;
            this.methods = params.methods;
            this.invoice = params.invoice;
            this.choices = [];

            // Functions
            this.initialization = function () {
                if (this.amountDue > 0) {
                    if (params.status.Stripe === true && this.methods.length > 0) {
                        this.method = this.methods[0];
                        this.choices.push({ value: 'card', label: gettextCatalog.getString('Credit card', null) });
                    }

                    if (params.status.Paypal === true && ($.browser.msie !== true || $.browser.edge === true)) { // IE11 doesn't support PayPal
                        this.choices.push({ value: 'paypal', label: 'PayPal' });
                    }

                    if (this.choices.length > 0) {
                        this.choice = this.choices[0];
                        this.changeChoice();
                    }
                }
            }.bind(this);

            this.label = function (method) {
                return '•••• •••• •••• ' + method.Details.Last4;
            };

            this.submit = function () {
                const parameters = {
                    Amount: params.amountDue,
                    Currency: params.currency
                };

                if (this.amountDue > 0 && this.choice.value === 'card' && this.methods.length > 0) {
                    parameters.PaymentMethodID = this.method.ID;
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
            }.bind(this);

            this.cancel = function () {
                params.close();
            };

            this.changeChoice = function () {
                if (this.choice.value === 'paypal') {
                    this.initPaypal();
                }
            };

            this.initPaypal = function () {
                Payment.paypal({
                    Amount: params.amountDue,
                    Currency: params.currency
                }).then((result) => {
                    if (result.data && result.data.Code === 1000) {
                        this.approvalURL = result.data.ApprovalURL;
                    } else if (result.data && result.data.Error) {
                        notify({ message: result.data.Error, classes: 'notification-danger' });
                    }
                });
            }.bind(this);

            this.openPaypalTab = function () {
                this.childWindow = window.open(this.approvalURL, 'PayPal');
                window.addEventListener('message', this.receivePaypalMessage, false);
            };

            this.receivePaypalMessage = function (event) {
                const origin = event.origin || event.originalEvent.origin; // For Chrome, the origin property is in the event.originalEvent object.

                if (origin !== 'https://secure.protonmail.com') {
                    return;
                }

                const paypalObject = event.data;

                paypalObject.PayerID = paypalObject.payerID;
                paypalObject.PaymentID = paypalObject.paymentID;
                delete paypalObject.payerID;
                delete paypalObject.paymentID;

                Payment.pay(params.invoice.ID, {
                    Amount: params.amountDue,
                    Currency: params.currency,
                    Payment: {
                        Type: 'paypal',
                        Details: paypalObject
                    }
                }).then((result) => {
                    if (result.data && result.data.Code === 1000) {
                        eventManager.call();
                        params.close(true);
                    } else if (result.data && result.data.Error) {
                        notify({ message: result.data.Error, classes: 'notification-danger' });
                    }
                });

                this.childWindow.close();
                window.removeEventListener('message', this.receivePaypalMessage, false);
            }.bind(this);

            this.initialization();
        }
    });
});
