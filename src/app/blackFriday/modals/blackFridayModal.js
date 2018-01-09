/* @ngInject */
function blackFridayModal($rootScope, $state, authentication, CONSTANTS, pmModal, blackFridayModel, subscriptionModel) {
    const { TWO_YEARS } = CONSTANTS.CYCLE;
    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: require('../../../templates/blackFriday/blackFridayModal.tpl.html'),
        /* @ngInject */
        controller: function(params, $scope) {
            const unsubscribe = $rootScope.$on('blackFriday', (event, { type = '' }) => {
                if (type === 'loaded') {
                    $scope.$applyAsync(() => {
                        this.loaded = true;
                    });
                }
            });

            this.loaded = false;
            this.isFreeUser = !authentication.user.Subscribed;
            this.isPaidUser = authentication.user.Subscribed;
            this.close = () => {
                blackFridayModel.saveClose();
                params.close();
            };

            this.dashboard = () => {
                if (!$state.is('secured.dashboard')) {
                    $state.go('secured.dashboard', {
                        noBlackFridayModal: true,
                        currency: this.currency,
                        cycle: TWO_YEARS
                    });
                }

                this.close();
            };

            this.buy = (plan = 'current') => {
                $rootScope.$emit('blackFriday', { type: 'buy', data: { plan } });
                this.close();
            };

            this.changeCurrency = (currency = 'EUR') => {
                this.currency = currency;
                blackFridayModel.set('currency', currency);
                $rootScope.$emit('closeDropdown');
            };

            this.$onDestroy = () => {
                unsubscribe();
            };

            this.currency = subscriptionModel.currency();
            this.changeCurrency(this.currency);
            // Load requirements for the payment modal
            $rootScope.$emit('blackFriday', { type: 'load' });
        }
    });
}
export default blackFridayModal;
