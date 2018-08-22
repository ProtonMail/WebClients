/* @ngInject */
function changeVPNNameModal(
    pmModal,
    notification,
    eventManager,
    gettextCatalog,
    networkActivityTracker,
    vpnSettingsModel
) {
    const successMessage = gettextCatalog.getString('OpenVPN login updated', null, 'Info');

    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: require('../../../templates/vpn/changeVPNNameModal.tpl.html'),
        /* @ngInject */
        controller: function(params) {
            const self = this;
            self.VPNName = params.name || '';
            self.submit = () => {
                const { VPNName } = self;
                const promise = vpnSettingsModel
                    .updateName({ VPNName })
                    .then(() => eventManager.call())
                    .then(() => (notification.success(successMessage), params.close(VPNName)));

                networkActivityTracker.track(promise);
            };
            self.cancel = () => params.close();
        }
    });
}
export default changeVPNNameModal;
