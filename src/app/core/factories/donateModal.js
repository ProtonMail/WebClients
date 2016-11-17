angular.module('proton.core')
.factory('donateModal', (authentication, pmModal, Payment, notify, tools, networkActivityTracker, gettextCatalog, $q) => {
    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: 'templates/modals/donate.tpl.html',
        controller(params) {
            // Variables
            this.process = false;
            this.text = params.message || 'Donate to ProtonMail';
            this.amount = 25;
            this.methods = [];
            this.months = [];

            for (let i = 1; i <= 12; i++) {
                this.months.push(i);
            }

            this.month = this.months[0];
            this.years = [];

            for (let i = 0; i < 12; i++) {
                this.years.push(new Date().getFullYear() + i);
            }

            this.currencies = [
                { label: 'USD', value: 'USD' },
                { label: 'EUR', value: 'EUR' },
                { label: 'CHF', value: 'CHF' }
            ];
            this.currency = _.findWhere(this.currencies, { value: authentication.user.Currency });
            this.number = '';
            this.month = this.months[0];
            this.year = this.years[0];
            this.cvc = '';
            this.fullname = '';
            this.countries = tools.countries;
            this.country = _.findWhere(this.countries, { value: 'US' });
            this.zip = '';

            if (angular.isDefined(params.currency)) {
                this.currency = _.findWhere(this.currencies, { value: params.currency });
            }

            if (angular.isDefined(params.methods) && params.methods.length > 0) {
                this.methods = params.methods;
                this.method = this.methods[0];
            }

            // Functions
            const validateCardNumber = function () {
                return Payment.validateCardNumber(this.number);
            }.bind(this);

            const validateCardExpiry = function () {
                return Payment.validateCardExpiry(this.month, this.year);
            }.bind(this);

            const validateCardCVC = function () {
                return Payment.validateCardCVC(this.cvc);
            }.bind(this);

            const donatation = function () {
                const year = (this.year.length === 2) ? '20' + this.year : this.year;
                const amount = this.otherAmount || this.amount;

                this.process = true;

                return Payment.donate({
                    Amount: amount * 100, // Don't be afraid
                    Currency: this.currency.value,
                    Payment: {
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
                    }
                });
            }.bind(this);

            const donatationWithMethod = function () {
                const amount = this.otherAmount || this.amount;
                this.process = true;

                return Payment.donate({
                    Amount: amount * 100, // Don't be afraid
                    Currency: this.currency.value,
                    PaymentMethodID: this.method.ID
                });
            }.bind(this);

            const finish = function (result) {
                const deferred = $q.defer();

                this.process = false;

                if (result.data && result.data.Code === 1000) {
                    deferred.resolve();
                    notify({ message: 'Your support is essential to keeping ProtonMail running. Thank you for supporting internet privacy!', classes: 'notification-success' });
                    this.close();
                } else if (result.data && result.data.Error) {
                    deferred.reject(new Error(result.data.Error));
                } else {
                    deferred.resolve(new Error(gettextCatalog.getString('Error while processing donation.', null, 'Error')));
                }

                return deferred.promise;
            }.bind(this);

            this.label = (method) => {
                return '•••• •••• •••• ' + method.Details.Last4;
            };

            this.selectAmount = (amount) => {
                this.otherAmount = null;
                this.amount = amount;
            };

            this.onFocusOtherAmount = () => {
                this.amount = null;
            };

            this.donate = () => {
                let promise;

                if (this.methods.length > 0) {
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

            this.close = function () {
                if (angular.isDefined(params.close) && angular.isFunction(params.close)) {
                    params.close();
                }
            };
        }
    });
});
