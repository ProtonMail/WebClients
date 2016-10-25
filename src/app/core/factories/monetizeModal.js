angular.module('proton.core')
.factory('monetizeModal', (pmModal, authentication) => {
    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: 'templates/modals/monetize.tpl.html',
        controller(params) {
            this.currencies = [
                { label: 'USD', value: 'USD' },
                { label: 'EUR', value: 'EUR' },
                { label: 'CHF', value: 'CHF' }
            ];
            this.currency = _.findWhere(this.currencies, { value: authentication.user.Currency });
            this.amount = 25; // default value for the amount
            this.amounts = [
                { label: '5', value: 5 },
                { label: '10', value: 10 },
                { label: '25', value: 25 },
                { label: '50', value: 50 },
                { label: '100', value: 100 }
            ];

            this.donate = function () {
                params.donate(this.amount, this.currency.value);
            }.bind(this);

            this.upgrade = function () {
                params.upgrade();
            };

            this.close = function () {
                params.close();
            };
        }
    });
});
