/* @ngInject */
function changeVPNPasswordModal(
    pmModal,
    notification,
    eventManager,
    gettextCatalog,
    networkActivityTracker,
    vpnSettingsModel
) {
    const successMessage = gettextCatalog.getString('OpenVPN password updated', null, 'Info');

    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: require('../../../templates/vpn/changeVPNPasswordModal.tpl.html'),
        /* @ngInject */
        controller: function(params) {
            const self = this;
            self.VPNPassword = '';
            self.passwordDefined = params.password;
            self.submit = () => {
                const { VPNPassword } = self;
                const promise = vpnSettingsModel
                    .updatePassword({ VPNPassword })
                    .then(() => eventManager.call())
                    .then(() => (notification.success(successMessage), params.close(VPNPassword)));

                networkActivityTracker.track(promise);
            };
            self.cancel = () => params.close();
        }
    });
}
export default changeVPNPasswordModal;
