angular.module('proton.core')
.factory('lifetimeModal', (pmModal, Payment, gettextCatalog, networkActivityTracker, authentication) => {
    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: 'templates/modals/lifetime.tpl.html',
        controller(params) {
            const self = this;
            self.amount = 1337;
            self.card = {};
            self.currencies = [{ label: 'USD', value: 'USD' }, { label: 'EUR', value: 'EUR' }, { label: 'CHF', value: 'CHF' }];
            self.currency = _.findWhere(self.currencies, { value: authentication.user.Currency });
            Payment.methods().then((result) => {
                const { data } = result;
                if (data.Code === 1000) {
                    self.methods = data.PaymentMethods.map((method) => ({ label: '•••• ' + method.Details.Last4, type: 'card', id: method.ID }));
                    self.methods.push({ label: gettextCatalog.getString('New card', null), type: 'new_card' });
                    self.methods.push({ label: 'Paypal', type: 'paypal' });
                    self.method = self.methods[0];
                }
            });
            self.submit = () => {
                const promise = Payment.credit(getParameters())
                .then((result) => {
                    const { data } = result;
                    if (data.Code === 1000) {
                        // Success
                    } else if (data.Error) {
                        return Promise.reject(data.Error);
                    }
                });
                networkActivityTracker.track(promise);
            };
            self.cancel = () => {
                params.close();
            };
            function getParameters() {
                const currency = self.currency.value;
                const parameters = {
                    Amount: self.amount * 100,
                    Currency: currency
                };
                if (self.methods.length) {
                    parameters.PaymentMethodID = '';
                } else {
                    const { number, month, year, cvc, fullname, zip } = self.card;
                    const country = self.card.country.value;
                    parameters.Payment = {
                        Type: 'card',
                        Details: {
                            Number: number,
                            ExpMonth: month,
                            ExpYear: year,
                            CVC: cvc,
                            Name: fullname,
                            Country: country,
                            ZIP: zip
                        }
                    };
                }
                return parameters;
            }
        }
    });
});
