/* @ngInject */
function customVpnModal(dashboardConfiguration, dispatchers, pmModal, customVpnModel) {
    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: require('../../../templates/dashboard/customVpnModal.tpl.html'),
        /* @ngInject */
        controller: function(params) {
            const { dispatcher } = dispatchers(['dashboard']);
            const config = dashboardConfiguration.get();
            const plan = params.plan;

            customVpnModel.init(plan);

            this.fromPlan = `customVpnModal-from-${plan}`;
            this.hasVpn = config[plan].vpnbasic || config[plan].vpnplus;
            this.close = () => params.close();
            this.remove = () => (dispatcher.dashboard('remove.vpn'), params.close());
            this.submit = () => {
                const vpnplus = customVpnModel.get('vpnplus');
                const vpn = customVpnModel.get('vpn');

                dispatcher.dashboard('select.vpn', { plan: vpnplus ? 'vpnplus' : 'vpnbasic', vpn });
                params.close();
            };
        }
    });
}
export default customVpnModal;
