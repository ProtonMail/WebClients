/* @ngInject */
function vpnTotal(CONSTANTS, customVpnModel, dashboardConfiguration, dashboardModel, dispatchers) {
    return {
        replace: true,
        restrict: 'E',
        scope: {},
        templateUrl: require('../../../templates/dashboard/vpnTotal.tpl.html'),
        link(scope, element) {
            const { on, unsubscribe } = dispatchers();
            const $amount = element.find('.vpnTotal-amount');
            const updateAmount = () => {
                const amount = customVpnModel.amount();

                $amount.text(`${dashboardModel.filter(amount)}/mo`);
            };

            on('dashboard', (event, { type = '' }) => {
                if (type === 'vpn.modal.updated') {
                    updateAmount();
                }
            });

            scope.$on('$destroy', unsubscribe);
        }
    };
}
export default vpnTotal;
