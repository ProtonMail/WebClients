angular.module('proton.dashboard')
    .directive('freeColumn', ($rootScope, dashboardConfiguration) => {
        const SHOW_VPN = 'freeColumn-show-vpn';
        return {
            restrict: 'E',
            replace: true,
            scope: {},
            templateUrl: 'templates/dashboard/freeColumn.tpl.html',
            link(scope, element) {
                const update = () => {
                    const { free } = dashboardConfiguration.get();
                    const action = (free.vpnplus || free.vpnbasic) ? 'add' : 'remove';

                    element[0].classList[action](SHOW_VPN);
                };

                const unsubscribe = $rootScope.$on('dashboard', (event, { type }) => {
                    if (type === 'vpn.updated') {
                        update();
                    }
                });

                update();

                scope.$on('$destroy', () => unsubscribe());
            }
        };
    });
