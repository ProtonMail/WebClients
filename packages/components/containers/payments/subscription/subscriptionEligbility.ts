import { type ADDON_NAMES, PLANS } from '@proton/payments';
import { CYCLE, isFreeSubscription } from '@proton/shared/lib/constants';
import { getHas2023OfferCoupon, getPlan } from '@proton/shared/lib/helpers/subscription';
import type { Plan, PlansMap, SubscriptionModel, UserModel } from '@proton/shared/lib/interfaces';

import type { OfferConfig } from '../../offers/interface';

export interface PlanCombination {
    plan: Plan;
    coupon?: string;
    cycle: CYCLE;
}

export interface PlanCombinationWithDiscount extends PlanCombination {
    discount: number;
}

export type Eligibility =
    | {
          type: 'upsell';
          planCombination: PlanCombinationWithDiscount;
      }
    | {
          type: 'sub-user';
      }
    | {
          type: 'subscribed';
      }
    | {
          type: 'bf-applied';
      }
    | {
          type: 'pass-through';
      }
    | {
          type: 'not-eligible';
      };

const getSafePlan = (plansMap: PlansMap, planName: PLANS | ADDON_NAMES) => {
    const plan = plansMap?.[planName];
    if (!plan) {
        throw new Error('Missing plan');
    }
    return plan;
};

const getVpnFifteenOffer = (plansMap: PlansMap): Eligibility => {
    const plan = getSafePlan(plansMap, PLANS.VPN);
    return {
        type: 'upsell',
        planCombination: {
            plan,
            cycle: CYCLE.FIFTEEN,
            discount: 52,
        },
    };
};

const getVpnThirtyOffer = (plansMap: PlansMap): Eligibility => {
    const plan = getSafePlan(plansMap, PLANS.VPN);
    return {
        type: 'upsell',
        planCombination: {
            plan,
            cycle: CYCLE.THIRTY,
            discount: 60,
        },
    };
};

const getVpnPassFifteenOffer = (plansMap: PlansMap): Eligibility => {
    const plan = getSafePlan(plansMap, PLANS.VPN_PASS_BUNDLE);
    return {
        type: 'upsell',
        planCombination: {
            plan,
            cycle: CYCLE.FIFTEEN,
            discount: 47,
        },
    };
};

const getVpnPassThirtyOffer = (plansMap: PlansMap): Eligibility => {
    const plan = getSafePlan(plansMap, PLANS.VPN_PASS_BUNDLE);
    return {
        type: 'upsell',
        planCombination: {
            plan,
            cycle: CYCLE.THIRTY,
            discount: 55,
        },
    };
};

const getBundleOffer = (plansMap: PlansMap): Eligibility => {
    const plan = getSafePlan(plansMap, PLANS.BUNDLE);
    return {
        type: 'upsell',
        planCombination: {
            plan,
            cycle: CYCLE.YEARLY,
            discount: 33,
        },
    };
};

interface Combination {
    latest: {
        plan: PLANS;
        cycles: CYCLE[];
    };
    target: {
        plan: PLANS;
        cycles: CYCLE[];
    };
    result: () => Eligibility;
}

export const getEligibility = ({
    user,
    offer,
    subscription,
    plansMap,
    eligibleBlackFridayConfigs,
}: {
    user: UserModel;
    subscription: SubscriptionModel | null | undefined;
    offer: { plan: Plan; cycle: CYCLE; coupon?: string };
    plansMap: PlansMap;
    eligibleBlackFridayConfigs: OfferConfig[];
}): Eligibility => {
    if (!user.canPay) {
        return { type: 'sub-user' };
    }

    const latest = subscription?.UpcomingSubscription ?? subscription;
    const latestPlan = latest ? getPlan(latest) : undefined;

    const okResult = (): Eligibility => ({ type: 'pass-through' });

    if (getHas2023OfferCoupon(offer.coupon)) {
        if (
            eligibleBlackFridayConfigs.some((config) => {
                return config.deals.some((deal) => {
                    return deal.cycle === offer.cycle && deal.planIDs[offer.plan.Name];
                });
            })
        ) {
            return okResult();
        }

        const getPlusUpsell = (from: PLANS, to: PLANS) => {
            return {
                latest: {
                    plan: from,
                    cycles: [CYCLE.MONTHLY, CYCLE.YEARLY, CYCLE.TWO_YEARS],
                },
                target: {
                    plan: to,
                    cycles: [CYCLE.MONTHLY, CYCLE.FIFTEEN, CYCLE.THIRTY],
                },
                result: () => getBundleOffer(plansMap),
            };
        };

        const vpnUpsells: Combination[] = [
            {
                latest: {
                    plan: PLANS.VPN,
                    cycles: [CYCLE.MONTHLY],
                },
                target: {
                    plan: PLANS.VPN,
                    cycles: [CYCLE.MONTHLY],
                },
                result: () => getVpnFifteenOffer(plansMap),
            },
            {
                latest: {
                    plan: PLANS.VPN,
                    cycles: [CYCLE.YEARLY, CYCLE.FIFTEEN],
                },
                target: {
                    plan: PLANS.VPN,
                    cycles: [CYCLE.MONTHLY, CYCLE.FIFTEEN],
                },
                result: () => getVpnThirtyOffer(plansMap),
            },
            {
                latest: {
                    plan: PLANS.VPN,
                    cycles: [CYCLE.TWO_YEARS, CYCLE.THIRTY],
                },
                target: {
                    plan: PLANS.VPN,
                    cycles: [CYCLE.MONTHLY, CYCLE.FIFTEEN, CYCLE.THIRTY],
                },
                result: () => getBundleOffer(plansMap),
            },
            {
                latest: {
                    plan: PLANS.PASS,
                    cycles: [CYCLE.MONTHLY],
                },
                target: {
                    plan: PLANS.VPN,
                    cycles: [CYCLE.MONTHLY, CYCLE.FIFTEEN],
                },
                result: () => getVpnPassFifteenOffer(plansMap),
            },
            {
                latest: {
                    plan: PLANS.PASS,
                    cycles: [CYCLE.MONTHLY],
                },
                target: {
                    plan: PLANS.VPN,
                    cycles: [CYCLE.THIRTY],
                },
                result: () => getVpnPassThirtyOffer(plansMap),
            },
            {
                latest: {
                    plan: PLANS.PASS,
                    cycles: [CYCLE.YEARLY],
                },
                target: {
                    plan: PLANS.VPN,
                    cycles: [CYCLE.MONTHLY, CYCLE.FIFTEEN],
                },
                result: () => getVpnPassFifteenOffer(plansMap),
            },
            {
                latest: {
                    plan: PLANS.PASS,
                    cycles: [CYCLE.YEARLY],
                },
                target: {
                    plan: PLANS.VPN,
                    cycles: [CYCLE.THIRTY],
                },
                result: () => getVpnPassThirtyOffer(plansMap),
            },
            {
                latest: {
                    plan: PLANS.PASS,
                    cycles: [CYCLE.TWO_YEARS],
                },
                target: {
                    plan: PLANS.VPN,
                    cycles: [CYCLE.MONTHLY, CYCLE.FIFTEEN, CYCLE.THIRTY],
                },
                result: () => getVpnPassThirtyOffer(plansMap),
            },
            {
                latest: {
                    plan: PLANS.BUNDLE,
                    cycles: [CYCLE.MONTHLY],
                },
                target: {
                    plan: PLANS.VPN,
                    cycles: [CYCLE.MONTHLY, CYCLE.FIFTEEN, CYCLE.THIRTY],
                },
                result: () => getBundleOffer(plansMap),
            },
            {
                latest: {
                    plan: PLANS.BUNDLE,
                    cycles: [CYCLE.MONTHLY],
                },
                target: {
                    plan: PLANS.VPN_PASS_BUNDLE,
                    cycles: [CYCLE.MONTHLY, CYCLE.FIFTEEN, CYCLE.THIRTY],
                },
                result: () => getBundleOffer(plansMap),
            },
            getPlusUpsell(PLANS.MAIL, PLANS.VPN),
            getPlusUpsell(PLANS.MAIL, PLANS.VPN_PASS_BUNDLE),
            getPlusUpsell(PLANS.DRIVE, PLANS.VPN),
            getPlusUpsell(PLANS.DRIVE, PLANS.VPN_PASS_BUNDLE),
        ];

        const vpnPassUpsells: Combination[] = [
            {
                latest: {
                    plan: PLANS.VPN,
                    cycles: [CYCLE.YEARLY],
                },
                target: {
                    plan: PLANS.VPN_PASS_BUNDLE,
                    cycles: [CYCLE.FIFTEEN],
                },
                result: () => getVpnPassThirtyOffer(plansMap),
            },
            {
                latest: {
                    plan: PLANS.VPN,
                    cycles: [CYCLE.FIFTEEN],
                },
                target: {
                    plan: PLANS.VPN_PASS_BUNDLE,
                    cycles: [CYCLE.FIFTEEN],
                },
                result: () => getVpnPassThirtyOffer(plansMap),
            },
            {
                latest: {
                    plan: PLANS.VPN,
                    cycles: [CYCLE.TWO_YEARS, CYCLE.THIRTY],
                },
                target: {
                    plan: PLANS.VPN_PASS_BUNDLE,
                    cycles: [CYCLE.FIFTEEN, CYCLE.THIRTY],
                },
                result: () => getBundleOffer(plansMap),
            },
            {
                latest: {
                    plan: PLANS.PASS,
                    cycles: [CYCLE.TWO_YEARS],
                },
                target: {
                    plan: PLANS.VPN_PASS_BUNDLE,
                    cycles: [CYCLE.FIFTEEN],
                },
                result: () => getVpnPassThirtyOffer(plansMap),
            },
        ];

        const bundle12Ok: Combination[] = [
            {
                latest: {
                    plan: PLANS.BUNDLE,
                    cycles: [CYCLE.MONTHLY],
                },
                target: {
                    plan: PLANS.BUNDLE,
                    cycles: [CYCLE.YEARLY],
                },
                result: okResult,
            },
            {
                latest: {
                    plan: PLANS.MAIL,
                    cycles: [CYCLE.MONTHLY, CYCLE.YEARLY, CYCLE.TWO_YEARS],
                },
                target: {
                    plan: PLANS.BUNDLE,
                    cycles: [CYCLE.YEARLY],
                },
                result: okResult,
            },
            {
                latest: {
                    plan: PLANS.DRIVE,
                    cycles: [CYCLE.MONTHLY, CYCLE.YEARLY, CYCLE.TWO_YEARS],
                },
                target: {
                    plan: PLANS.BUNDLE,
                    cycles: [CYCLE.YEARLY],
                },
                result: okResult,
            },
            {
                latest: {
                    plan: PLANS.PASS,
                    cycles: [CYCLE.MONTHLY, CYCLE.YEARLY, CYCLE.TWO_YEARS],
                },
                target: {
                    plan: PLANS.BUNDLE,
                    cycles: [CYCLE.YEARLY],
                },
                result: okResult,
            },
            {
                latest: {
                    plan: PLANS.VPN,
                    cycles: [CYCLE.MONTHLY, CYCLE.YEARLY, CYCLE.TWO_YEARS],
                },
                target: {
                    plan: PLANS.BUNDLE,
                    cycles: [CYCLE.YEARLY],
                },
                result: okResult,
            },
        ];

        // Assumes upsells are first
        const vpnPassBundleOk: Combination[] = [
            {
                latest: {
                    plan: PLANS.FREE,
                    cycles: [],
                },
                target: {
                    plan: PLANS.VPN_PASS_BUNDLE,
                    cycles: [CYCLE.FIFTEEN, CYCLE.THIRTY],
                },
                result: okResult,
            },
            {
                latest: {
                    plan: PLANS.PASS,
                    cycles: [CYCLE.MONTHLY, CYCLE.YEARLY, CYCLE.TWO_YEARS],
                },
                target: {
                    plan: PLANS.VPN_PASS_BUNDLE,
                    cycles: [CYCLE.FIFTEEN, CYCLE.THIRTY],
                },
                result: okResult,
            },
            {
                latest: {
                    plan: PLANS.VPN,
                    cycles: [CYCLE.MONTHLY, CYCLE.YEARLY, CYCLE.FIFTEEN, CYCLE.TWO_YEARS, CYCLE.THIRTY],
                },
                target: {
                    plan: PLANS.VPN_PASS_BUNDLE,
                    cycles: [CYCLE.FIFTEEN, CYCLE.THIRTY],
                },
                result: okResult,
            },
        ];

        const combinations: Combination[] = [...vpnUpsells, ...vpnPassUpsells, ...bundle12Ok, ...vpnPassBundleOk];

        const combination = combinations.find((combination) => {
            const correctPlan =
                combination.latest.plan === PLANS.FREE
                    ? isFreeSubscription(latest)
                    : latestPlan?.Name === combination.latest.plan;
            const correctCycle =
                combination.latest.plan === PLANS.FREE
                    ? true
                    : combination.latest.cycles.includes(latest?.Cycle as any);
            return (
                combination.target.plan === offer.plan.Name &&
                combination.target.cycles.includes(offer.cycle) &&
                correctPlan &&
                correctCycle
            );
        });

        if (combination) {
            return combination.result();
        }

        return { type: 'not-eligible' };
    }

    return okResult();
};
