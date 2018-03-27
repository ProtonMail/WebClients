/* @ngInject */
function vpnView(dispatchers, addressesModel, authentication, memberModel, vpnModel) {
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
                const { Status } = vpnModel.get();

                scope.VPNLogin = memberModel.isMember() ? getFirstEmail() : authentication.user.Name;
                scope.vpnStatus = Status;
            };

            on('updateUser', update);

            update();

            scope.$on('$destroy', unsubscribe);
        }
    };
}
export default vpnView;
