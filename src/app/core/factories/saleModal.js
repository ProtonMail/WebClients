angular.module('proton.core')
.factory('saleModal', (pmModal, Payment, gettextCatalog, networkActivityTracker, authentication) => {
    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: 'templates/modals/sale.tpl.html',
        controller(params) {
            const { close, methods } = params;
            const self = this;
            self.amount = 1337;
            self.mode = 'pay';
            self.card = {};
            self.paypalObject = {};
            self.currencies = [{ label: 'USD', value: 'USD' }, { label: 'EUR', value: 'EUR' }, { label: 'CHF', value: 'CHF' }];
            self.currency = _.findWhere(self.currencies, { value: authentication.user.Currency });
            self.methods = methods.map((method) => ({ label: '•••• ' + method.Details.Last4, type: 'card', id: method.ID }));
            self.methods.push({ label: gettextCatalog.getString('New card', null), type: 'new_card' });
            self.methods.push({ label: 'Paypal', type: 'paypal' });
            self.method = self.methods[0];
            self.submit = () => {
                const promise = Payment.credit(getParameters())
                .then((result = {}) => {
                    const { data = {} } = result;
                    if (data.Error) {
                        return Promise.reject(data.Error);
                    }
                    return Promise.resolve(result);
                })
                .then(() => {
                    self.mode = 'thanks';
                });
                networkActivityTracker.track(promise);
            };
            self.cancel = () => {
                close();
            };
            function getParameters() {
                const currency = self.currency.value;
                const parameters = {
                    Amount: self.amount * 100,
                    Currency: currency
                };
                switch (self.method.type) {
                    case 'new_card':
                        parameters.Payment = {
                            Type: 'card',
                            Details: {
                                Number: self.card.number,
                                ExpMonth: self.card.month,
                                ExpYear: (self.card.year.length === 2) ? '20' + self.card.year : self.card.year,
                                CVC: self.card.cvc,
                                Name: self.card.fullname,
                                Country: self.card.country.value,
                                ZIP: self.card.zip
                            }
                        };
                        break;
                    case 'card':
                        parameters.PaymentMethodID = self.method.id;
                        break;
                    case 'paypal':
                        parameters.Payment = {
                            Type: 'paypal',
                            Details: self.paypalObject
                        };
                        break;
                    default:
                        break;
                }
                return parameters;
            }
        }
    });
});
