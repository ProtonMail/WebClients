angular.module('proton.core')
.factory('donateModal', (authentication, pmModal, Payment, notify, tools, networkActivityTracker, gettextCatalog, $q) => {
    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: 'templates/modals/donate.tpl.html',
        controller(params) {
            const self = this;
            self.process = false;
            self.amount = 25;
            self.methods = [];
            self.currencies = [
                { label: 'USD', value: 'USD' },
                { label: 'EUR', value: 'EUR' },
                { label: 'CHF', value: 'CHF' }
            ];
            self.currency = _.findWhere(self.currencies, { value: authentication.user.Currency });
            self.card = {};
            if (angular.isDefined(params.methods) && params.methods.length > 0) {
                self.methods = params.methods;
                self.method = self.methods[0];
            }

            // Functions
            const validateCardNumber = () => {
                return Payment.validateCardNumber(self.card.number);
            };

            const validateCardExpiry = () => {
                return Payment.validateCardExpiry(self.card.month, self.card.year);
            };

            const validateCardCVC = () => {
                return Payment.validateCardCVC(self.card.cvc);
            };

            const donatation = () => {
                const amount = self.otherAmount || self.amount;
                const { number, month, year, cvc, fullname, zip } = self.card;
                const country = self.card.country.value;
                const currency = self.currency.value;

                self.process = true;

                return Payment.donate({
                    Amount: amount * 100, // Don't be afraid
                    Currency: currency,
                    Payment: {
                        Type: 'card',
                        Details: {
                            Number: number,
                            ExpMonth: month,
                            ExpYear: (year.length === 2) ? '20' + year : year,
                            CVC: cvc,
                            Name: fullname,
                            Country: country,
                            ZIP: zip
                        }
                    }
                });
            };

            const donatationWithMethod = () => {
                const amount = self.otherAmount || self.amount;
                self.process = true;

                return Payment.donate({
                    Amount: amount * 100, // Don't be afraid
                    Currency: self.currency.value,
                    PaymentMethodID: self.method.ID
                });
            };

            const finish = (result) => {
                const deferred = $q.defer();

                self.process = false;

                if (result.data && result.data.Code === 1000) {
                    deferred.resolve();
                    notify({ message: 'Your support is essential to keeping ProtonMail running. Thank you for supporting internet privacy!', classes: 'notification-success' });
                    self.close();
                } else if (result.data && result.data.Error) {
                    deferred.reject(new Error(result.data.Error));
                } else {
                    deferred.resolve(new Error(gettextCatalog.getString('Error while processing donation.', null, 'Error')));
                }

                return deferred.promise;
            };

            self.label = (method) => {
                return '•••• •••• •••• ' + method.Details.Last4;
            };

            self.selectAmount = (amount) => {
                self.otherAmount = null;
                self.amount = amount;
            };

            self.onFocusOtherAmount = () => {
                self.amount = null;
            };

            self.donate = () => {
                let promise;

                if (self.methods.length > 0) {
                    promise = donatationWithMethod()
                    .then(finish)
                    .catch((error) => {
                        notify({ message: error, classes: 'notification-danger' });
                    });
                } else {
                    promise = validateCardNumber()
                    .then(validateCardExpiry)
                    .then(validateCardCVC)
                    .then(donatation)
                    .then(finish)
                    .catch((error) => {
                        notify({ message: error, classes: 'notification-danger' });
                    });
                }

                networkActivityTracker.track(promise);
            };

            self.close = () => {
                if (angular.isDefined(params.close) && angular.isFunction(params.close)) {
                    params.close();
                }
            };
        }
    });
});
