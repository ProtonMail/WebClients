angular.module('proton.vpn')
.directive('vpnView', ($rootScope, $state, CONSTANTS, authentication, organizationModel) => {
    const isMember = () => authentication.user.Role === CONSTANTS.PAID_MEMBER_ROLE;
    const isPlus = () => {
        const { PlanName } = organizationModel.get();
        return PlanName === 'plus';
    };
    const vpnAccess = () => {
        const { Status = 0 } = authentication.user.VPN;
        return Status === 1;
    };
    const getFirstEmail = () => {
        const { Addresses = [] } = authentication.user;
        return (Addresses.length) ? Addresses[0].Email : '';
    };
    return {
        restrict: 'E',
        replace: true,
        scope: {},
        templateUrl: 'templates/vpn/vpnView.tpl.html',
        link(scope) {
            isMember() && $state.go('secured.account');
            const unsubscribes = [];
            const update = () => {
                scope.VPNLogin = getFirstEmail();
                scope.vpnEnabled = vpnAccess();
                scope.isPlus = isPlus();
            };

            unsubscribes.push($rootScope.$on('updateUser', () => update()));

            scope.$on('$destroy', () => {
                unsubscribes.forEach((callback) => callback());
                unsubscribes.length = 0;
            });

            update();
        }
    };
});
