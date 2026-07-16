import { c } from 'ttag';

import { VpnLogo } from '@proton/components';
import { getVPNPassProPlan, getVPNPlan } from '@proton/components/containers/payments/features/plan';
import { getAllPlatforms, getFreeFeatures, getRefundable } from '@proton/components/containers/payments/features/vpn';
import { getCheckoutUi } from '@proton/payments/core/checkout';
import { CYCLE, PLANS, PLAN_NAMES } from '@proton/payments/core/constants';
import type { Currency } from '@proton/payments/core/interface';
import type { Plan, PlansMap } from '@proton/payments/core/plan/interface';
import { getPrice } from '@proton/payments/core/price-helpers';

import type { SubscriptionDataCycleMapping } from '../single-signup-v2/helper';

export const getUpsellShortPlan = (plan: Plan | undefined) => {
    if (!plan) {
        return undefined;
    }

    // Handle specific plans that need custom features or formatting
    if (plan.Name === PLANS.VPN2024) {
        const vpnPlan = getVPNPlan(plan);
        return {
            logo: <VpnLogo variant="with-wordmark" />,
            ...vpnPlan,
            features: [...vpnPlan.features, getFreeFeatures(), getAllPlatforms(), getRefundable()],
        };
    }

    if (plan.Name === PLANS.VPN_PASS_BUNDLE_BUSINESS) {
        const vpnPassProPlan = getVPNPassProPlan(plan);
        return {
            ...vpnPassProPlan,
            features: [...(vpnPassProPlan.features || []), getFreeFeatures(), getAllPlatforms(), getRefundable()],
        };
    }

    // For any other plan, return basic info with the plan's title
    // This provides a fallback for plans like VPN_BUSINESS, VPN_PRO, etc.
    return {
        plan: plan.Name,
        title: plan.Title,
        label: '',
        description: '',
        cta: '',
        features: [getFreeFeatures(), getAllPlatforms(), getRefundable()],
    };
};

export const getOffText = (discount: string, billingCycle: string) => {
    // translator: full sentence is "Get 33% off with a 2-year subscription"
    return c('vpn_2step: discount').t`Get ${discount} off with a ${billingCycle} subscription`;
};

export const getPassText = () => {
    // translator: full sentence is "Get a first year of Pass Plus for free!"
    const plan = PLAN_NAMES[PLANS.PASS];
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

/**
 * Per-month price of adding Proton Pass on top of VPN Plus, i.e. the VPN+Pass bundle minus VPN Plus.
 */
export const getVpnPassBundleUpsellMonthlyPrice = ({
    cycle,
    currency,
    plansMap,
    subscriptionDataCycleMapping,
}: {
    cycle: CYCLE;
    currency: Currency;
    plansMap: PlansMap;
    subscriptionDataCycleMapping: SubscriptionDataCycleMapping | undefined;
}): number => {
    const vpnCheck = subscriptionDataCycleMapping?.[PLANS.VPN2024]?.[cycle]?.checkResult;
    const bundleCheck = subscriptionDataCycleMapping?.[PLANS.VPN_PASS_BUNDLE]?.[cycle]?.checkResult;

    if (vpnCheck && bundleCheck && vpnCheck.Currency === currency && bundleCheck.Currency === currency) {
        const bundlePerMonth = getCheckoutUi({
            planIDs: { [PLANS.VPN_PASS_BUNDLE]: 1 },
            plansMap,
            checkResult: bundleCheck,
        }).withDiscountPerMonth;
        const vpnPerMonth = getCheckoutUi({
            planIDs: { [PLANS.VPN2024]: 1 },
            plansMap,
            checkResult: vpnCheck,
        }).withDiscountPerMonth;
        return bundlePerMonth - vpnPerMonth;
    }

    const vpnPrice = getPrice({ [PLANS.VPN2024]: 1 }, cycle, plansMap) / cycle;
    const bundlePrice = getPrice({ [PLANS.VPN_PASS_BUNDLE]: 1 }, cycle, plansMap) / cycle;
    return bundlePrice - vpnPrice;
};
