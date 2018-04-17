/* @ngInject */
function vpnModel(dispatchers, authentication, vpnApi) {
    let vpn = angular.copy(authentication.user.VPN);

    const { on } = dispatchers();
    const get = () => vpn;
    const set = (newVpn = {}) => (vpn = { ...vpn, ...newVpn });
    const clear = () => (vpn = {});
    const fetch = () => vpnApi.get().then(set);

    on('updateUser', () => {
        set(authentication.user.VPN);
    });

    return { get, fetch, set, clear };
}
export default vpnModel;
