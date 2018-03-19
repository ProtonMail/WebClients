/* @ngInject */
function freeColumn(dashboardConfiguration, dispatchers) {
    const SHOW_VPN = 'freeColumn-show-vpn';
    return {
        restrict: 'E',
        replace: true,
        scope: {},
        templateUrl: require('../../../templates/dashboard/freeColumn.tpl.html'),
        link(scope, element) {
            const { on, unsubscribe } = dispatchers();
            const update = () => {
                const { free } = dashboardConfiguration.get();
                const action = free.vpnplus || free.vpnbasic ? 'add' : 'remove';

                element[0].classList[action](SHOW_VPN);
            };

            on('dashboard', (event, { type }) => {
                if (type === 'vpn.updated') {
                    update();
                }
            });

            update();

            scope.$on('$destroy', unsubscribe);
        }
    };
}
export default freeColumn;
