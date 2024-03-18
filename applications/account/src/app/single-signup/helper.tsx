import { c } from 'ttag';

import { VpnLogo } from '@proton/components/components';
import { getVPNPlan } from '@proton/components/containers/payments/features/plan';
import { getAllPlatforms, getFreeFeatures, getRefundable } from '@proton/components/containers/payments/features/vpn';
import { BillingAddress, PaymentsApi } from '@proton/components/payments/core';
import { CYCLE, PLANS } from '@proton/shared/lib/constants';
import { getNormalCycleFromCustomCycle } from '@proton/shared/lib/helpers/subscription';
import { Currency, Cycle, Plan, VPNServersCountData } from '@proton/shared/lib/interfaces';
import { getFreeCheckResult } from '@proton/shared/lib/subscription/freePlans';

import { getSubscriptionPrices } from '../signup/helper';
import { PlanIDs, SubscriptionData } from '../signup/interfaces';

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

export const getSubscriptionData = async ({
    paymentsApi,
    couponCode,
    planIDs,
    cycle,
    currency,
    minimumCycle,
    billingAddress,
}: {
    paymentsApi: PaymentsApi;
    currency: Currency;
    couponCode?: string;
    planIDs: PlanIDs;
    cycle: Cycle;
    minimumCycle?: Cycle;
    billingAddress: BillingAddress;
}): Promise<SubscriptionData> => {
    const result = await getSubscriptionPrices(paymentsApi, planIDs || {}, currency, cycle, billingAddress, couponCode)
        .then((checkResult) => {
            return {
                checkResult,
                planIDs,
            };
        })
        .catch(() => {
            // If the check call fails, just reset everything
            return {
                checkResult: getFreeCheckResult(
                    currency,
                    // "Reset" the cycle because the custom cycles are only valid with a coupon
                    getNormalCycleFromCustomCycle(cycle)
                ),
                planIDs: undefined,
            };
        });

    return {
        cycle: result.checkResult.Cycle,
        minimumCycle: minimumCycle,
        currency: result.checkResult.Currency,
        checkResult: result.checkResult,
        planIDs: result.planIDs || {},
        skipUpsell: !!result.planIDs,
        billingAddress,
    };
};
