import { c } from 'ttag';

import { VpnLogo } from '@proton/components';
import { getVPNPlan } from '@proton/components/containers/payments/features/plan';
import { getAllPlatforms, getFreeFeatures, getRefundable } from '@proton/components/containers/payments/features/vpn';
import { CYCLE, PASS_APP_NAME, PLANS } from '@proton/shared/lib/constants';
import type { Plan, VPNServersCountData } from '@proton/shared/lib/interfaces';

export const getUpsellShortPlan = (plan: Plan | undefined, vpnServersCountData: VPNServersCountData) => {
    if (plan && plan.Name === PLANS.VPN) {
        const vpnPlan = getVPNPlan(plan, vpnServersCountData);
        return {
            logo: <VpnLogo variant="with-wordmark" />,
            ...vpnPlan,
            features: [...vpnPlan.features, getFreeFeatures(), getAllPlatforms(), getRefundable()],
        };
    }
};

export const getOffText = (discount: string, billingCycle: string) => {
    // translator: full sentence is "Get 33% off with a 2-year subscription"
    return c('vpn_2step: discount').t`Get ${discount} off with a ${billingCycle} subscription`;
};

export const getPassText = () => {
    // translator: full sentence is "Get a first year of Proton Pass Plus for free!"
    const plan = `${PASS_APP_NAME} Plus`;
    return c('vpn_2step: discount').t`Get a first year of ${plan} for free!`;
};

export const getBillingCycleText = (cycle: CYCLE) => {
    if (cycle === CYCLE.MONTHLY) {
        // translator: full sentence is "Get 33% off with a monthly subscription"
        return c('vpn_2step: discount').t`monthly`;
    }

    if (cycle === CYCLE.THREE) {
        // translator: full sentence is "Get 33% off with a 3-month subscription"
        return c('vpn_2step: discount').t`3-month`;
    }

    if (cycle === CYCLE.YEARLY) {
        // translator: full sentence is "Get 33% off with a 1-year subscription"
        return c('vpn_2step: discount').t`1-year`;
    }
    if (cycle === CYCLE.TWO_YEARS) {
        // translator: full sentence is "Get 33% off with a 2-year subscription"
        return c('vpn_2step: discount').t`2-year`;
    }

    if (cycle === CYCLE.FIFTEEN) {
        // translator: full sentence is "Get 33% off with a 15-month subscription"
        return c('vpn_2step: discount').t`15-month`;
    }

    if (cycle === CYCLE.EIGHTEEN) {
        // translator: full sentence is "Get 33% off with a 18-month subscription"
        return c('vpn_2step: discount').t`18-month`;
    }

    if (cycle === CYCLE.THIRTY) {
        // translator: full sentence is "Get 33% off with a 30-month subscription"
        return c('vpn_2step: discount').t`30-month`;
    }
};
