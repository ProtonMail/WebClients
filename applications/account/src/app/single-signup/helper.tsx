import { VpnLogo } from '@proton/components/components';
import { getVPNPlan } from '@proton/components/containers/payments/features/plan';
import { getAllPlatforms, getFreeFeatures, getRefundable } from '@proton/components/containers/payments/features/vpn';
import { PLANS } from '@proton/shared/lib/constants';
import { Plan, VPNServersCountData } from '@proton/shared/lib/interfaces';

export const getUpsellShortPlan = (plan: Plan | undefined, vpnServersCountData: VPNServersCountData) => {
    if (plan && plan?.Name === PLANS.VPN) {
        const vpnPlan = getVPNPlan(plan, vpnServersCountData);
        return {
            logo: <VpnLogo variant="with-wordmark" />,
            ...vpnPlan,
            features: [...vpnPlan.features, getFreeFeatures(), getAllPlatforms(), getRefundable()],
        };
    }
};
