angular.module('proton.core')
.factory('cardModal', (pmModal, Payment, notify, pmcw, tools, gettextCatalog, $q, networkActivityTracker) => {
    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: 'templates/modals/card.tpl.html',
        controller(params) {
            // Variables
            this.countries = tools.countries;
            this.cardChange = false;
            this.process = false;
            this.months = [];
            this.years = [];

            for (let i = 1; i <= 12; i++) {
                this.months.push(i);
            }

            this.month = this.months[0];

            for (let i = 0; i < 12; i++) {
                this.years.push(new Date().getFullYear() + i);
            }

            if (params.method) {
                this.text = 'Update your credit card information.';
                this.number = '•••• •••• •••• ' + params.method.Details.Last4;
                this.fullname = params.method.Details.Name;
                this.month = this.months[this.months.indexOf(parseInt(params.method.Details.ExpMonth, 10))];
                this.year = this.years[this.years.indexOf(parseInt(params.method.Details.ExpYear, 10))];
                this.cvc = '•••';
                this.zip = params.method.Details.ZIP;
                this.country = _.findWhere(this.countries, { value: params.method.Details.Country });
            } else {
                this.text = 'Add a credit card.';
                this.number = '';
                this.fullname = '';
                this.month = this.months[0];
                this.year = this.years[0];
                this.cvc = '';
                this.zip = '';
                this.country = _.findWhere(this.countries, { value: 'US' });
            }

            // Functions
            const validateCardNumber = function () {
                if (this.cardChange === true) {
                    return Payment.validateCardNumber(this.number);
                }
                return Promise.resolve();
            }.bind(this);

            const validateCardExpiry = function () {
                if (this.cardChange === true) {
                    return Payment.validateCardExpiry(this.month, this.year);
                }
                return Promise.resolve();
            }.bind(this);

            const validateCardCVC = function () {
                if (this.cardChange === true) {
                    return Payment.validateCardCVC(this.cvc);
                }
                return Promise.resolve();
            }.bind(this);

            const method = function () {
                const deferred = $q.defer();

                if (this.cardChange === true) {
                    const year = (this.year.length === 2) ? '20' + this.year : this.year;

                    Payment.updateMethod({
                        Type: 'card',
                        Details: {
                            Number: this.number,
                            ExpMonth: this.month,
                            ExpYear: year,
                            CVC: this.cvc,
                            Name: this.fullname,
                            Country: this.country.value,
                            ZIP: this.zip
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
            }.bind(this);

            const finish = function (method) {
                params.close(method);
            };

            this.submit = function () {
                this.process = true;

                networkActivityTracker.track(
                    validateCardNumber()
                    .then(validateCardExpiry)
                    .then(validateCardCVC)
                    .then(method)
                    .then(finish)
                    .catch((error) => {
                        notify({ message: error, classes: 'notification-danger' });
                        this.process = false;
                    })
                );
            };

            this.cancel = function () {
                params.close();
            };
        }
    });
});
