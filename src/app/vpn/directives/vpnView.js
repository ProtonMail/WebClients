/* @ngInject */
function vpnView(dispatchers, addressesModel, authentication, memberModel) {
    const vpnStatus = () => {
        const { Status = 0 } = authentication.user.VPN;
        return Status;
    };

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
                scope.vpnEnabled = vpnStatus();
            };

            update();
            on('updateUser', update);

            scope.$on('$destroy', unsubscribe);
        }
    };
}
export default vpnView;
