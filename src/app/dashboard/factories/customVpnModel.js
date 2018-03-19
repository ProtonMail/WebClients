/* @ngInject */
function customVpnModel(CONSTANTS, dashboardConfiguration, dashboardModel, dispatchers) {
    const { MAX_VPN, PLANS } = CONSTANTS;
    const { PLAN, ADDON } = PLANS;
    const { VPN } = ADDON;
    const { VPN_BASIC, VPN_PLUS } = PLAN;
    const CACHE = {};
    const { dispatcher, on } = dispatchers(['dashboard']);
    const dispatch = () => dispatcher.dashboard('vpn.modal.updated');
    const set = (key, value) => {
        CACHE[key] = value;
        dispatch();
    };
    const get = (key) => (key ? CACHE[key] : angular.copy(CACHE));
    const parameters = () => {
        const { addons } = dashboardModel.get(dashboardConfiguration.cycle());
        const vpn = addons[VPN];
        const vpnplus = addons[VPN_PLUS];
        const step = vpn.MaxVPN;
        const min = vpnplus.MaxVPN;
        const start = CACHE.vpn + vpnplus.MaxVPN;
        const max = MAX_VPN;

        return {
            value: start,
            options: {
                type: 'vpn',
                animate: false,
                tooltips: true,
                connect: [true, false],
                start,
                step,
                range: { min, max },
                pips: {
                    mode: 'positions',
                    values: [0, 100],
                    density: 4,
                    stepped: true
                },
                format: {
                    to(value) {
                        return `${Number(value).toFixed()}`;
                    },
                    from(value) {
                        return value;
                    }
                }
            }
        };
    };

    const init = (plan) => {
        const config = dashboardConfiguration.get();
        const { vpnbasic = 0, vpnplus = 0, vpn = 0 } = config[plan];

        CACHE.vpnbasic = vpnbasic;
        CACHE.vpnplus = !vpnbasic && !vpnplus ? 1 : vpnplus; // Select ProtonVPN Plus by default
        CACHE.vpn = vpn;
        dispatch();
    };

    const amount = () => {
        const amounts = dashboardModel.amounts();
        let result = 0;

        if (CACHE.vpnbasic) {
            result += amounts[VPN_BASIC];
        }

        if (CACHE.vpnplus) {
            result += amounts[VPN_PLUS];
        }

        if (CACHE.vpn) {
            result += CACHE.vpn * amounts[VPN];
        }

        return result;
    };

    on('slider.updated', (event, { type = '', data = {} }) => {
        if (type === 'vpn') {
            const { addons } = dashboardModel.get(dashboardConfiguration.cycle());
            const vpnplus = addons[VPN_PLUS];

            CACHE.vpn = data.value - vpnplus.MaxVPN;
            dispatch();
        }
    });

    return { init, set, get, parameters, amount };
}
export default customVpnModel;
