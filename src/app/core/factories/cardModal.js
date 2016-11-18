angular.module('proton.core')
.factory('cardModal', (pmModal, Payment, notify, pmcw, tools, gettextCatalog, $q, networkActivityTracker) => {
    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: 'templates/modals/card.tpl.html',
        controller(params) {
            // Variables
            const self = this;
            self.process = false;
            if (params.method) {
                self.text = gettextCatalog.getString('Update your credit card information.', null);
                self.mode = 'display';
                self.panel = {
                    fullname: params.method.Details.Name,
                    number: '•••• •••• •••• ' + params.method.Details.Last4,
                    month: params.method.Details.ExpMonth,
                    year: params.method.Details.ExpYear,
                    cvc: '•••',
                    zip: params.method.Details.ZIP,
                    country: params.method.Details.Country
                };
            } else {
                self.text = gettextCatalog.getString('Add a credit card.', null);
                self.mode = 'edition';
                self.card = {};
            }

            // Functions
            const validateCardNumber = () => {
                if (self.mode === 'edition') {
                    return Payment.validateCardNumber(self.number);
                }
                return Promise.resolve();
            };

            const validateCardExpiry = () => {
                if (self.mode === 'edition') {
                    return Payment.validateCardExpiry(self.month, self.year);
                }
                return Promise.resolve();
            };

            const validateCardCVC = () => {
                if (self.mode === 'edition') {
                    return Payment.validateCardCVC(self.cvc);
                }
                return Promise.resolve();
            };

            const method = () => {
                const deferred = $q.defer();

                if (self.mode === 'edition') {
                    const year = (self.year.length === 2) ? '20' + self.year : self.year;

                    Payment.updateMethod({
                        Type: 'card',
                        Details: {
                            Number: self.number,
                            ExpMonth: self.month,
                            ExpYear: year,
                            CVC: self.cvc,
                            Name: self.fullname,
                            Country: self.country.value,
                            ZIP: self.zip
                        }
                    }).then((result) => {
                        if (result.data && result.data.Code === 1000) {
                            deferred.resolve(result.data.PaymentMethod);
                        } else if (result.data && result.data.Error) {
                            deferred.reject(new Error(result.data.Error));
                        }
                    });
                } else {
                    deferred.resolve();
                }

                return deferred.promise;
            };

            const finish = (method) => {
                params.close(method);
            };

            self.submit = () => {
                self.process = true;

                networkActivityTracker.track(
                    validateCardNumber()
                    .then(validateCardExpiry)
                    .then(validateCardCVC)
                    .then(method)
                    .then(finish)
                    .catch((error) => {
                        notify({ message: error, classes: 'notification-danger' });
                        self.process = false;
                    })
                );
            };

            self.cancel = () => {
                params.close();
            };
        }
    });
});
