import { c } from 'ttag';

import { VpnLogo } from '@proton/components/components';
import { getVPNPlan } from '@proton/components/containers/payments/features/plan';
import { getAllPlatforms, getFreeFeatures, getRefundable } from '@proton/components/containers/payments/features/vpn';
import { COUPON_CODES, CYCLE, DEFAULT_CURRENCY, PLANS } from '@proton/shared/lib/constants';
import { getNormalCycleFromCustomCycle } from '@proton/shared/lib/helpers/subscription';
import { Api, Currency, Cycle, Plan, VPNServersCountData } from '@proton/shared/lib/interfaces';
import { getFreeCheckResult } from '@proton/shared/lib/subscription/freePlans';
import isTruthy from '@proton/utils/isTruthy';

import { getSubscriptionPrices } from '../signup/helper';
import { PlanIDs, SubscriptionData } from '../signup/interfaces';
import { SignupParameters, getPlanIDsFromParams } from '../signup/searchParams';
import { SignupDefaults, SubscriptionDataCycleMapping } from '../single-signup-v2/interface';

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

    const hasExtraCycles =
        couponCode === COUPON_CODES.BLACK_FRIDAY_2023 || [CYCLE.FIFTEEN, CYCLE.THIRTY].includes(cycle);

    const getStandardMapping = async (): Promise<SubscriptionDataCycleMapping> => {
        const [
            subscriptionDataMonthly,
            subscriptionDataYearly,
            subscriptionDataTwoYears,
            subscriptionDataFifteen,
            subscriptionDataThirty,
        ] = await Promise.all(
            [
                CYCLE.MONTHLY,
                CYCLE.YEARLY,
                CYCLE.TWO_YEARS,
                ...(hasExtraCycles ? [CYCLE.FIFTEEN, CYCLE.THIRTY] : []),
            ].map((cycle) =>
                getSubscriptionData({
                    api,
                    currency,
                    couponCode,
                    planIDs: planParameters.planIDs,
                    cycle,
                })
            )
        );

        const isBFOfferActive = subscriptionDataFifteen?.checkResult.Coupon?.Code === COUPON_CODES.BLACK_FRIDAY_2023;

        return {
            planIDs: subscriptionDataMonthly.planIDs,
            mapping: {
                [CYCLE.MONTHLY]: subscriptionDataMonthly,
                [CYCLE.YEARLY]: subscriptionDataYearly,
                [CYCLE.TWO_YEARS]: subscriptionDataTwoYears,
                [CYCLE.FIFTEEN]: isBFOfferActive ? subscriptionDataFifteen : undefined,
                [CYCLE.THIRTY]: isBFOfferActive ? subscriptionDataThirty : undefined,
            },
        };
    };

    const getBFMapping = async (): Promise<SubscriptionDataCycleMapping | undefined> => {
        if (couponCode !== COUPON_CODES.BLACK_FRIDAY_2023) {
            return;
        }
        const [subscriptionDataMonthly, subscriptionDataFifteen, subscriptionDataThirty] = await Promise.all(
            [CYCLE.MONTHLY, CYCLE.FIFTEEN, CYCLE.THIRTY].map((cycle) =>
                getSubscriptionData({
                    api,
                    currency,
                    couponCode,
                    planIDs: {
                        [PLANS.VPN_PASS_BUNDLE]: 1,
                    },
                    cycle,
                })
            )
        );
        return {
            planIDs: subscriptionDataMonthly.planIDs,
            mapping: {
                [CYCLE.MONTHLY]: subscriptionDataMonthly,
                [CYCLE.YEARLY]: undefined,
                [CYCLE.TWO_YEARS]: undefined,
                [CYCLE.FIFTEEN]: subscriptionDataFifteen,
                [CYCLE.THIRTY]: subscriptionDataThirty,
            },
        };
    };

    const subscriptionDataCycleMapping = (await Promise.all([getStandardMapping(), getBFMapping()])).filter(isTruthy);
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
