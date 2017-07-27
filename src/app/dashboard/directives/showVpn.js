angular.module('proton.dashboard')
    .directive('showVpn', ($rootScope) => {
        const SHOW_VPN_CLASS = 'showVpn';

        return {
            restrict: 'A',
            scope: {},
            link(scope, element) {
                const unsubscribe = $rootScope.$on('dashboard', (event, { type, data = {} }) => {
                    if (type === 'addon.updated' && data.addon === 'vpn') {
                        if (data.value === 'vpnbasic' || data.value === 'vpnplus') {
                            element.addClass(SHOW_VPN_CLASS);
                        } else {
                            element.removeClass(SHOW_VPN_CLASS);
                        }
                    }
                });

                scope.$on('$destroy', () => unsubscribe());
            }
        };
    });
