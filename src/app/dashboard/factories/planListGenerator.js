import _ from 'lodash';

import { PLANS } from '../../constants';

const { PLAN, ADDON } = PLANS;

/* @ngInject */
function planListGenerator(dashboardConfiguration) {
    const makeAddons = (plan, addons) => (key) => {
        const addon = ADDON[key.toUpperCase()];
        return _.times(plan[key], () => addons[addon]);
    };

    const free = ({ addons = {} } = {}) => {
        const plans = [];
        const { free = {} } = dashboardConfiguration.get();
        free.vpnbasic && plans.push(addons[PLAN.VPN_BASIC]);
        free.vpnplus && plans.push(addons[PLAN.VPN_PLUS]);
        return plans;
    };

    const plus = ({ addons = {}, plan = {} }) => {
        const plans = [plan[PLAN.PLUS]];
        const { plus = {} } = dashboardConfiguration.get();
        const listAddons = makeAddons(plus, addons);

        plus.vpnbasic && plans.push(addons[PLAN.VPN_BASIC]);
        plus.vpnplus && plans.push(addons[PLAN.VPN_PLUS]);

        const list = listAddons('space').concat(listAddons('address'), listAddons('domain'));
        plans.push(...list);
        return plans;
    };

    const professional = ({ addons = {}, plan = {} } = {}) => {
        const plans = [plan[PLAN.PROFESSIONAL]];
        const { professional = {} } = dashboardConfiguration.get();
        const listAddons = makeAddons(professional, addons);

        professional.vpnbasic && plans.push(addons[PLAN.VPN_BASIC]);
        professional.vpnplus && plans.push(addons[PLAN.VPN_PLUS]);

        const list = listAddons('member').concat(listAddons('domain'), listAddons('vpn'));
        plans.push(...list);
        return plans;
    };

    const visionary = ({ plan = {} } = {}) => [plan[PLAN.VISIONARY]];

    return { free, plus, professional, visionary };
}
export default planListGenerator;
