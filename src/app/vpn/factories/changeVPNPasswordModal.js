angular.module('proton.vpn')
.factory('changeVPNPasswordModal', (pmModal, settingsApi, notify, eventManager, gettextCatalog, networkActivityTracker) => {
    const successMessage = gettextCatalog.getString('OpenVPN password updated', null, 'Info');
    const errorMessage = gettextCatalog.getString('VPN request failed', null, 'Error');
    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: 'templates/vpn/changeVPNPasswordModal.tpl.html',
        controller(params) {
            const self = this;
            self.VPNPassword = '';
            self.passwordDefined = params.password;
            self.submit = () => {
                const { VPNPassword } = self;
                const promise = settingsApi.updateVPNPassword({ VPNPassword })
                .then(({ data = {} } = {}) => {
                    if (data.Code === 1000) {
                        return Promise.resolve();
                    }
                    throw new Error(data.Error || errorMessage);
                })
                .then(() => eventManager.call())
                .then(() => (notify({ message: successMessage, classes: 'notification-success' }), params.close(VPNPassword)));
                networkActivityTracker.track(promise);
            };
            self.cancel = () => params.close();
        }
    });
});
