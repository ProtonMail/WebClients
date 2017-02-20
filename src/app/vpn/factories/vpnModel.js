angular.module('proton.vpn')
.factory('vpnModel', ($rootScope, authentication, gettextCatalog, vpnApi) => {
    let vpn = angular.copy(authentication.user.VPN);
    const errorMessage = gettextCatalog.getString('VPN request failed', null, 'Error');

    function get() {
        return vpn;
    }

    function fetch() {
        return vpnApi.get()
        .then(({ data = {} } = {}) => {
            if (data.Code === 1000) {
                set(data.VPN);
                return Promise.resolve(data.VPN);
            }
            throw new Error(data.Error || errorMessage);
        });
    }

    function set(newVpn) {
        vpn = _.extend({}, vpn, newVpn);
    }

    function clear() {
        vpn = {};
    }

    $rootScope.$on('updateUser', () => {
        set(authentication.user.VPN);
    });

    return { get, fetch, set, clear };
});
