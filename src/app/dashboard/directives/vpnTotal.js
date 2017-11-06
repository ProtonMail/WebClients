angular.module('proton.dashboard')
    .directive('vpnTotal', ($rootScope, customVpnModel, dashboardConfiguration, dashboardModel) => {
        return {
            replace: true,
            restrict: 'E',
            scope: {},
            templateUrl: 'templates/dashboard/vpnTotal.tpl.html',
            link(scope, element) {
                const $amount = element.find('.vpnTotal-amount');
                const updateAmount = () => {
                    const cycle = dashboardConfiguration.cycle() === 12 ? '/mo' : '';
                    const amount = customVpnModel.amount();

                    $amount.text(`${dashboardModel.filter(amount)}${cycle}`);
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
