angular.module('proton.dashboard')
    .directive('vpnTotal', ($rootScope, CONSTANTS, customVpnModel, dashboardConfiguration, dashboardModel) => {
        return {
            replace: true,
            restrict: 'E',
            scope: {},
            templateUrl: 'templates/dashboard/vpnTotal.tpl.html',
            link(scope, element) {
                const $amount = element.find('.vpnTotal-amount');
                const updateAmount = () => {
                    const amount = customVpnModel.amount();

                    $amount.text(`${dashboardModel.filter(amount)}/mo`);
                };
                const unsubscribe = $rootScope.$on('dashboard', (event, { type = '' }) => {
                    if (type === 'vpn.modal.updated') {
                        updateAmount();
                    }
                });

                scope.$on('$destroy', () => {
                    unsubscribe();
                });
            }
        };
    });
