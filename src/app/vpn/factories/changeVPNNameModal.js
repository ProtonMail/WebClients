/* @ngInject */
function changeVPNNameModal(pmModal, notification, eventManager, networkActivityTracker, vpnSettingsModel) {
    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: require('../../../templates/vpn/changeVPNNameModal.tpl.html'),
        /* @ngInject */
        controller: function(params, gettextCatalog) {
            const success = gettextCatalog.getString('OpenVPN login updated', null, 'Info');

            this.VPNName = params.name || '';
            this.submit = () => {
                const { VPNName } = this;
                const promise = vpnSettingsModel
                    .updateName({ VPNName })
                    .then(() => eventManager.call())
                    .then(() => (notification.success(success), params.close(VPNName)));

                networkActivityTracker.track(promise);
            };
            this.cancel = () => params.close();
        }
    });
}
export default changeVPNNameModal;
