import { c } from 'ttag';

import { VpnLogo } from '@proton/components/components';
import { getVPNPlan } from '@proton/components/containers/payments/features/plan';
import { getAllPlatforms, getFreeFeatures, getRefundable } from '@proton/components/containers/payments/features/vpn';
import { CYCLE, DEFAULT_CURRENCY, PLANS } from '@proton/shared/lib/constants';
import { getHas2023OfferCoupon, getNormalCycleFromCustomCycle } from '@proton/shared/lib/helpers/subscription';
import { Api, Currency, Cycle, CycleMapping, Plan, VPNServersCountData } from '@proton/shared/lib/interfaces';
import { getFreeCheckResult } from '@proton/shared/lib/subscription/freePlans';
import isTruthy from '@proton/utils/isTruthy';

import { getSubscriptionPrices } from '../signup/helper';
import { PlanIDs, SubscriptionData } from '../signup/interfaces';
import { SignupParameters, getPlanIDsFromParams } from '../signup/searchParams';
import { SignupDefaults, SubscriptionDataCycleMapping } from '../single-signup-v2/interface';

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

    if (cycle === CYCLE.THIRTY) {
        // translator: full sentence is "Get 33% off with a 30-month subscription"
        return c('vpn_2step: discount').t`30-month`;
    }
};

export const getSubscriptionData = async ({
    api,
    couponCode,
    planIDs,
    cycle,
    currency,
    minimumCycle,
}: {
    api: Api;
    currency: Currency;
    couponCode?: string;
    planIDs: PlanIDs;
    cycle: Cycle;
    minimumCycle?: Cycle;
}): Promise<SubscriptionData> => {
    const result = await getSubscriptionPrices(api, planIDs || {}, currency, cycle, couponCode)
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
    };
};

export const getInitialSubscriptionDataForAllCycles = async ({
    Plans,
    signupParameters,
    api,
    defaults,
}: {
    Plans: Plan[];
    api: Api;
    signupParameters: SignupParameters;
    defaults: SignupDefaults;
}) => {
    const planParameters = getPlanIDsFromParams(Plans, signupParameters, defaults) || {};
    const currency = signupParameters.currency || Plans?.[0]?.Currency || DEFAULT_CURRENCY;
    const couponCode = signupParameters.coupon;
    const cycle = signupParameters.cycle || defaults.cycle;

    const getMapping = async (
        planIDs: PlanIDs,
        cycles: CycleMapping<boolean>
    ): Promise<CycleMapping<SubscriptionData>> => {
        return Promise.all(
            Object.entries(cycles).map(([key, run]) => {
                if (!run) {
                    return [];
                }
                const cycle = Number(key) as CYCLE;
                return getSubscriptionData({
                    api,
                    currency,
                    couponCode,
                    planIDs,
                    cycle,
                }).then((result) => [cycle, result]);
            })
        ).then(Object.fromEntries);
    };

    const getStandardMapping = async (): Promise<SubscriptionDataCycleMapping | undefined> => {
        const planIDs = planParameters.planIDs;

        const hasCustomCycles =
            ((planIDs[PLANS.VPN] || planIDs[PLANS.VPN_PASS_BUNDLE]) && getHas2023OfferCoupon(couponCode)) ||
            [CYCLE.FIFTEEN, CYCLE.THIRTY].includes(cycle);

        const mapping = await getMapping(planIDs, {
            [CYCLE.MONTHLY]: true,
            [CYCLE.YEARLY]: !hasCustomCycles,
            [CYCLE.TWO_YEARS]: !hasCustomCycles,
            [CYCLE.FIFTEEN]: hasCustomCycles,
            [CYCLE.THIRTY]: hasCustomCycles,
        });

        const isBFOfferActive = getHas2023OfferCoupon(mapping[CYCLE.FIFTEEN]?.checkResult.Coupon?.Code);

        if (hasCustomCycles && !isBFOfferActive) {
            delete mapping[CYCLE.FIFTEEN];
            delete mapping[CYCLE.THIRTY];
            const normalMapping = await getMapping(planIDs, {
                [CYCLE.YEARLY]: true,
                [CYCLE.TWO_YEARS]: true,
            });
            mapping[CYCLE.YEARLY] = normalMapping[CYCLE.YEARLY];
            mapping[CYCLE.TWO_YEARS] = normalMapping[CYCLE.TWO_YEARS];
        }

        return {
            planIDs,
            mapping,
        };
    };

    const getBFMapping = async (): Promise<SubscriptionDataCycleMapping | undefined> => {
        if (!getHas2023OfferCoupon(couponCode)) {
            return;
        }
        const planIDs = {
            [PLANS.VPN_PASS_BUNDLE]: 1,
        };
        const mapping = await getMapping(planIDs, {
            [CYCLE.FIFTEEN]: true,
            [CYCLE.THIRTY]: true,
        });
        return {
            planIDs,
            mapping,
        };
    };

    const getBundleMapping = async () => {
        if (!getHas2023OfferCoupon(couponCode) || planParameters.defined) {
            return;
        }
        const planIDs = {
            [PLANS.BUNDLE]: 1,
        };
        const mapping = await getMapping(planIDs, {
            [CYCLE.YEARLY]: true,
        });
        return {
            planIDs,
            mapping,
        };
    };

    const subscriptionDataCycleMapping = (
        await Promise.all([getStandardMapping(), getBFMapping(), getBundleMapping()])
    ).filter(isTruthy);
    const first = subscriptionDataCycleMapping[0];

    let subscriptionData = first.mapping[cycle] ?? first.mapping[CYCLE.TWO_YEARS];
    // BF setter
    if (
        first.mapping[CYCLE.THIRTY] &&
        ![CYCLE.MONTHLY, CYCLE.FIFTEEN, CYCLE.THIRTY].includes(subscriptionData?.cycle as any)
    ) {
        subscriptionData = first.mapping[CYCLE.THIRTY];
    }

    return {
        subscriptionData,
        subscriptionDataCycleMapping,
    };
};
