angular.module('proton.core')
.factory('cardModal', (pmModal, Payment, notify, pmcw, tools, gettextCatalog, $q, networkActivityTracker) => {
    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: 'templates/modals/card.tpl.html',
        controller(params) {
            // Variables
            const self = this;
            self.process = false;
            self.card = {};
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
            }

            // Functions
            const validateCardNumber = () => {
                if (self.mode === 'edition') {
                    return Payment.validateCardNumber(self.card.number);
                }
                return Promise.resolve();
            };

            const validateCardExpiry = () => {
                if (self.mode === 'edition') {
                    return Payment.validateCardExpiry(self.card.month, self.card.year);
                }
                return Promise.resolve();
            };

            const validateCardCVC = () => {
                if (self.mode === 'edition') {
                    return Payment.validateCardCVC(self.card.cvc);
                }
                return Promise.resolve();
            };

            const method = () => {
                const deferred = $q.defer();

                if (self.mode === 'edition') {
                    const { number, month, year, cvc, fullname, zip } = self.card;
                    const country = self.card.country.value;

                    Payment.updateMethod({
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

            self.edit = () => {
                self.card.fullname = self.panel.fullname;
                self.mode = 'edition';
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
