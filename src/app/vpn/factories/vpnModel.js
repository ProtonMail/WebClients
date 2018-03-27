import _ from 'lodash';

/* @ngInject */
function vpnModel(dispatchers, authentication, gettextCatalog, vpnApi) {
    let vpn = angular.copy(authentication.user.VPN);
    const errorMessage = gettextCatalog.getString('VPN request failed', null, 'Error');

    const { on } = dispatchers();

    function get() {
        return vpn;
    }

    function fetch() {
        return vpnApi.get()
            .then(({ data = {} } = {}) => {
                set(data.VPN);
                return Promise.resolve(data.VPN);
            })
            .catch(({ data = {} } = {}) => {
                throw new Error(data.Error || errorMessage);
            });
    }

    function set(newVpn) {
        vpn = _.extend({}, vpn, newVpn);
    }

    function clear() {
        vpn = {};
    }

    on('updateUser', () => {
        set(authentication.user.VPN);
    });

    return { get, fetch, set, clear };
}
export default vpnModel;
