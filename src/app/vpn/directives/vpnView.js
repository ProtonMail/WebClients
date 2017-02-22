angular.module('proton.vpn')
.directive('vpnView', ($rootScope, $state, CONSTANTS, authentication) => {
    const isMember = () => authentication.user.Role === CONSTANTS.PAID_MEMBER_ROLE;
    const vpnAccess = () => {
        const { PlanName = '', Status = 0 } = authentication.user.VPN;
        return PlanName === 'visionary' && Status === 1;
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
            scope.vpnEnabled = vpnAccess();
            scope.VPNLogin = getFirstEmail();

            unsubscribes.push($rootScope.$on('updateUser', () => {
                scope.VPNLogin = getFirstEmail();
                scope.vpnEnabled = vpnAccess();
            }));

            scope.$on('$destroy', () => {
                unsubscribes.forEach((callback) => callback());
                unsubscribes.length = 0;
            });
        }
    };
});
