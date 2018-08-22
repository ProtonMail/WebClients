/* @ngInject */
function vpnView(dispatchers, addressesModel, authentication, memberModel, vpnSettingsModel) {
    const getFirstEmail = () => {
        const addresses = addressesModel.get();
        return addresses.length ? addresses[0].Email : '';
    };
    return {
        restrict: 'E',
        replace: true,
        scope: {},
        templateUrl: require('../../../templates/vpn/vpnView.tpl.html'),
        link(scope) {
            const { on, unsubscribe } = dispatchers();

            const update = () => {
                scope.VPNLogin = memberModel.isMember() ? getFirstEmail() : authentication.user.Name;
                scope.vpnStatus = vpnSettingsModel.get('Status');
                scope.hasPaidVpn = authentication.hasPaidVpn();
            };

            on('updateUser', () => {
                scope.$applyAsync(() => {
                    update();
                });
            });

            update();

            scope.$on('$destroy', unsubscribe);
        }
    };
}
export default vpnView;
