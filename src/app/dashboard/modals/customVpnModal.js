/* @ngInject */
function customVpnModal($rootScope, dashboardConfiguration, pmModal, customVpnModel) {
    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: require('../../../templates/dashboard/customVpnModal.tpl.html'),
        /* @ngInject */
        controller: function(params) {
            const config = dashboardConfiguration.get();
            const plan = params.plan;

            customVpnModel.init(plan);

            this.fromPlan = `customVpnModal-from-${plan}`;
            this.hasVpn = config[plan].vpnbasic || config[plan].vpnplus;
            this.close = () => params.close();
            this.remove = () => ($rootScope.$emit('dashboard', { type: 'remove.vpn' }), params.close());
            this.submit = () => {
                const vpnplus = customVpnModel.get('vpnplus');
                const vpn = customVpnModel.get('vpn');

                $rootScope.$emit('dashboard', { type: 'select.vpn', data: { plan: vpnplus ? 'vpnplus' : 'vpnbasic', vpn } });
                params.close();
            };
        }
    });
}
export default customVpnModal;
