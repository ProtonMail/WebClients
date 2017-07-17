angular.module('proton.core')
.factory('donateModal', (authentication, pmModal, Payment, notify, cardModel, networkActivityTracker, gettextCatalog, $rootScope, aboutClient) => {

    const CURRENCIES = [
        { label: 'USD', value: 'USD' },
        { label: 'EUR', value: 'EUR' },
        { label: 'CHF', value: 'CHF' }
    ];

    const notifySuccess = (message) => notify({ message, classes: 'notification-success' });
    const dispatch = (type, data = {}) => $rootScope.$emit('payments', { type, data });

    const I18N = {
        donation: {
            success: gettextCatalog.getString('Your support is essential to keeping ProtonMail running. Thank you for supporting internet privacy!', null, 'Donation modal'),
            error: gettextCatalog.getString('Error while processing donation.', null, 'Donation modal')
        },
        topUp: {
            success: gettextCatalog.getString('Credits added', null, 'topUp modal')
        }
    };

    const cardNumber = ({ Last4 = '' } = {}) => `•••• •••• •••• ${Last4}`;
    const formatMethods = (methods = []) => {
        return methods.map(({ ID = '', Details = {} }) => ({
            ID, label: cardNumber(Details),
            value: 'use.card'
        }));
    };

    const donate = (options = {}) => {
        const promise = Payment.donate(options)
            .then(({ data = {} }) => {
                if (data.Code === 1000) {
                    return I18N.donation.success;
                }
                throw new Error(data.Error || I18N.donation.error);
            });
        networkActivityTracker.track(promise);
        return promise;
    };

    const addCredits = (options = {}) => {
        const promise = Payment.credit(options)
            .then(({ data = {} }) => {
                if (data.Code === 1000) {
                    return I18N.topUp.success;
                }
                throw new Error(data.Error);
            });

        networkActivityTracker.track(promise);
        return promise;
    };

    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: 'templates/modals/donate.tpl.html',
        controller(params) {

            this.typeOfModal = params.type;
            this.process = false;
            this.amount = 25;
            this.currencies = CURRENCIES;
            this.currency = _.findWhere(this.currencies, { value: authentication.user.Currency });
            this.card = {};

            this.methods = [
                {
                    value: 'card',
                    label: gettextCatalog.getString('Credit card', null)
                }
            ];

            !aboutClient.isIE11() && this.methods.push({
                label: 'Paypal',
                value: 'paypal'
            });

            this.method = this.methods[0];

            if (params.methods && params.methods.length) {
                const size = this.methods.length;
                this.methods = this.methods.concat(formatMethods(params.methods));
                this.method = this.methods[size];
            }
            this.close = params.close;

            const getParameters = () => {
                const Amount = (this.otherAmount || this.amount) * 100;
                const Currency = this.currency.value;
                const parameters = { Amount, Currency };

                if (this.method.value === 'use.card') {
                    parameters.PaymentMethodID = this.method.ID;
                }

                if (this.method.value === 'card') {
                    parameters.Payment = {
                        Type: 'card',
                        Details: cardModel(this.card).details()
                    };
                }

                if (this.method.value === 'paypal') {
                    parameters.Payment = {
                        Type: 'paypal',
                        Details: this.paypalConfig
                    };
                }

                return parameters;
            };
            this.selectAmount = (amount) => {
                this.otherAmount = null;
                this.amount = amount;
                this.changeValue();
            };

            const getPromise = () => {
                if (params.type === 'topUp') {
                    return addCredits(getParameters());
                }
                return donate(getParameters());
            };


            this.donate = () => {
                this.process = true;
                getPromise()
                    .then(notifySuccess)
                    .then(() => dispatch(`${params.type}.success`))
                    .then(() => (this.process = false))
                    .then(this.close);
            };
            /**
             * Refresh component such as paypal
             */
            this.changeValue = () => {
                const ghost = this.method.value;

                if (ghost === 'paypal') {
                    this.method.value = '';
                    _rAF(() => {
                        $rootScope.$applyAsync(() => (this.method.value = ghost));
                    });
                }
            };

            this.getAmount = () => (this.otherAmount || this.amount || 0);
            this.paypalCallback = (config) => {
                this.paypalConfig = config;
                this.donate();
            };
            this.onFocusOtherAmount = () => (this.amount = null);
        }
    });
});
