angular.module('proton.vpn')
    .factory('changeVPNNameModal', (pmModal, settingsApi, notification, eventManager, gettextCatalog, networkActivityTracker) => {

        const successMessage = gettextCatalog.getString('OpenVPN login updated', null, 'Info');
        const errorMessage = gettextCatalog.getString('VPN request failed', null, 'Error');

        return pmModal({
            controllerAs: 'ctrl',
            templateUrl: 'templates/vpn/changeVPNNameModal.tpl.html',
            /* @ngInject */
            controller: function (params) {
                const self = this;
                self.VPNName = params.name || '';
                self.submit = () => {
                    const { VPNName } = self;
                    const promise = settingsApi.updateVPNName({ VPNName })
                        .then(({ data = {} } = {}) => {
                            if (data.Code === 1000) {
                                return Promise.resolve();
                            }
                            throw new Error(data.Error || errorMessage);
                        })
                        .then(() => eventManager.call())
                        .then(() => (notification.success(successMessage), params.close(VPNName)));
                    networkActivityTracker.track(promise);
                };
                self.cancel = () => params.close();
            }
        });
    });
