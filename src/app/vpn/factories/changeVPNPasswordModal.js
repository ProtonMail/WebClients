/* @ngInject */
function changeVPNPasswordModal(
    pmModal,
    notification,
    eventManager,
    gettextCatalog,
    networkActivityTracker,
    vpnSettingsModel
) {
    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: require('../../../templates/vpn/changeVPNPasswordModal.tpl.html'),
        /* @ngInject */
        controller: function(params, gettextCatalog) {

            const success = gettextCatalog.getString('OpenVPN password updated', null, 'Info');

            this.VPNPassword = '';
            this.passwordDefined = params.password;
            this.submit = () => {
                const { VPNPassword } = this;
                const promise = vpnSettingsModel
                    .updatePassword({ VPNPassword })
                    .then(() => eventManager.call())
                    .then(() => (notification.success(success), params.close(VPNPassword)));

                networkActivityTracker.track(promise);
            };
            this.cancel = () => params.close();
        }
    });
}
export default changeVPNPasswordModal;
