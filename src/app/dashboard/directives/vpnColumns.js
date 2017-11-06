angular.module('proton.dashboard')
    .directive('vpnColumns', ($rootScope, CONSTANTS, dashboardConfiguration, dashboardModel, customVpnModel) => {
        const { VPN_BASIC, VPN_PLUS } = CONSTANTS.PLANS.PLAN;
        const VPN_BASIC_SELECTED_CLASS = 'vpnColumns-vpnbasic-selected';
        const VPN_PLUS_SELECTED_CLASS = 'vpnColumns-vpnplus-selected';

        function onClick(event) {
            const action = event.target.getAttribute('data-action');

            switch (action) {
                case 'vpnbasic':
                    customVpnModel.set('vpnbasic', 1);
                    customVpnModel.set('vpnplus', 0);
                    customVpnModel.set('vpn', 0);
                    break;
                case 'vpnplus':
                    customVpnModel.set('vpnbasic', 0);
                    customVpnModel.set('vpnplus', 1);
                    break;
                default:
                    break;
            }
        }

        return {
            restrict: 'E',
            replace: true,
            scope: {},
            templateUrl: 'templates/dashboard/vpnColumns.tpl.html',
            link(scope, element) {
                const amounts = dashboardModel.amounts();
                const cycle = dashboardConfiguration.cycle() === 12 ? '/mo' : '';
                const update = () => {
                    element.removeClass(`${VPN_BASIC_SELECTED_CLASS} ${VPN_PLUS_SELECTED_CLASS}`);
                    customVpnModel.get('vpnbasic') && element.addClass(VPN_BASIC_SELECTED_CLASS);
                    customVpnModel.get('vpnplus') && element.addClass(VPN_PLUS_SELECTED_CLASS);
                };
                const unsubscribe = $rootScope.$on('dashboard', (event, { type }) => {
                    (type === 'vpn.modal.updated') && update();
                });

                scope.vpnbasicAmount = `${dashboardModel.filter(amounts[VPN_BASIC])}${cycle}`;
                scope.vpnplusAmount = `${dashboardModel.filter(amounts[VPN_PLUS])}${cycle}`;

                element.on('click', onClick);

                scope.$on('$destroy', () => {
                    element.off('click', onClick);
                    unsubscribe();
                });
            }
        };
    });
