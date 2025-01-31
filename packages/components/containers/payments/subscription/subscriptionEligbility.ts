import { type ADDON_NAMES, CYCLE, PLANS, isFreeSubscription } from '@proton/payments';
import { COUPON_CODES } from '@proton/shared/lib/constants';
import {
    getHas2024OfferCoupon,
    getIsB2BAudienceFromSubscription,
    getPlan,
} from '@proton/shared/lib/helpers/subscription';
import type { Plan, PlansMap, Subscription, UserModel } from '@proton/shared/lib/interfaces';

import type { OfferConfig } from '../../offers/interface';

export interface PlanCombination {
    plan: Plan;
    coupon?: string;
    cycle: CYCLE;
}

export type Eligibility =
    | {
          type: 'upsell';
          planCombination: PlanCombination;
          discount: number;
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

const getUpsellOffer = ({
    plan: planName,
    plansMap,
    discount = 50,
}: {
    plan: PLANS;
    plansMap: PlansMap;
    discount?: number;
}): Eligibility => {
    const plan = getSafePlan(plansMap, planName);
    return {
        type: 'upsell',
        discount,
        planCombination: {
            plan,
            cycle: CYCLE.YEARLY,
            coupon: COUPON_CODES.BLACK_FRIDAY_2024,
        },
    };
};

interface Combination {
    latest: {
        plan: (PLANS | ADDON_NAMES)[];
        cycles: CYCLE[];
    };
    target:
        | true
        | {
              plan: (PLANS | ADDON_NAMES)[];
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
    subscription: Subscription | undefined;
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

    if (getHas2024OfferCoupon(offer.coupon)) {
        if (
            eligibleBlackFridayConfigs.some((config) => {
                return config.deals.some((deal) => {
                    return deal.cycle === offer.cycle && deal.planIDs[offer.plan.Name];
                });
            })
        ) {
            return okResult();
        }

        const upsells: Combination[] = [
            // 1M,3M VPN -> 1Y,2Y VPN OK
            {
                latest: {
                    plan: [PLANS.FREE, PLANS.VPN, PLANS.VPN2024],
                    cycles: [CYCLE.MONTHLY, CYCLE.THREE],
                },
                target: {
                    plan: [PLANS.VPN2024],
                    cycles: [CYCLE.YEARLY, CYCLE.TWO_YEARS],
                },
                result: okResult,
            },
            // Pass -> Pass family OK
            {
                latest: {
                    plan: [PLANS.PASS],
                    cycles: [CYCLE.MONTHLY, CYCLE.YEARLY, CYCLE.TWO_YEARS],
                },
                target: {
                    plan: [PLANS.PASS_FAMILY],
                    cycles: [CYCLE.MONTHLY, CYCLE.YEARLY, CYCLE.TWO_YEARS],
                },
                result: okResult,
            },
            // Plus plan or free -> bundle, duo, family OK
            {
                latest: {
                    plan: [PLANS.FREE, PLANS.VPN, PLANS.VPN2024, PLANS.MAIL, PLANS.PASS, PLANS.DRIVE],
                    cycles: [CYCLE.MONTHLY, CYCLE.YEARLY, CYCLE.TWO_YEARS],
                },
                target: {
                    plan: [PLANS.BUNDLE, PLANS.DUO, PLANS.FAMILY],
                    cycles: [CYCLE.MONTHLY, CYCLE.YEARLY, CYCLE.TWO_YEARS],
                },
                result: okResult,
            },
            // Bundle -> duo, family OK
            {
                latest: {
                    plan: [PLANS.BUNDLE],
                    cycles: [CYCLE.MONTHLY, CYCLE.YEARLY, CYCLE.TWO_YEARS],
                },
                target: {
                    plan: [PLANS.DUO, PLANS.FAMILY],
                    cycles: [CYCLE.MONTHLY, CYCLE.YEARLY, CYCLE.TWO_YEARS],
                },
                result: okResult,
            },
            // Pass family & duo -> family OK
            {
                latest: {
                    plan: [PLANS.DUO, PLANS.PASS_FAMILY],
                    cycles: [CYCLE.MONTHLY, CYCLE.YEARLY, CYCLE.TWO_YEARS],
                },
                target: {
                    plan: [PLANS.FAMILY],
                    cycles: [CYCLE.MONTHLY, CYCLE.YEARLY, CYCLE.TWO_YEARS],
                },
                result: okResult,
            },
            // Bundle -> anything else, upsell to Duo
            {
                latest: {
                    plan: [PLANS.BUNDLE],
                    cycles: [CYCLE.MONTHLY, CYCLE.YEARLY, CYCLE.TWO_YEARS],
                },
                target: true,
                result: () => getUpsellOffer({ plan: PLANS.DUO, plansMap, discount: 40 }),
            },
            // Plus plan -> anything else upsell to bundle
            {
                latest: {
                    plan: [PLANS.VPN, PLANS.VPN2024, PLANS.MAIL, PLANS.PASS, PLANS.DRIVE],
                    cycles: [CYCLE.MONTHLY, CYCLE.YEARLY, CYCLE.TWO_YEARS],
                },
                target: true,
                result: () => getUpsellOffer({ plan: PLANS.BUNDLE, plansMap, discount: 50 }),
            },
            // Pass -> anything else upsell to Pass family
            {
                latest: {
                    plan: [PLANS.PASS],
                    cycles: [CYCLE.MONTHLY, CYCLE.YEARLY, CYCLE.TWO_YEARS],
                },
                target: true,
                result: () => getUpsellOffer({ plan: PLANS.PASS_FAMILY, plansMap, discount: 50 }),
            },
            // Pass family & duo -> anything else upsell to family
            {
                latest: {
                    plan: [PLANS.DUO, PLANS.PASS_FAMILY],
                    cycles: [CYCLE.MONTHLY, CYCLE.YEARLY, CYCLE.TWO_YEARS],
                },
                target: true,
                result: () => getUpsellOffer({ plan: PLANS.FAMILY, plansMap, discount: 40 }),
            },
        ];

        const combinations: Combination[] = upsells;

        const combination = combinations.find((combination) => {
            const correctFree = combination.latest.plan.includes(PLANS.FREE) && isFreeSubscription(subscription);
            const correctPlan = correctFree || combination.latest.plan.includes(latestPlan?.Name as any);
            const correctCycle = correctFree ? true : combination.latest.cycles.includes(latest?.Cycle as any);
            return (
                (combination.target === true ||
                    (combination.target.plan.includes(offer.plan.Name) &&
                        combination.target.cycles.includes(offer.cycle))) &&
                correctPlan &&
                correctCycle
            );
        });

        if (combination) {
            return combination.result();
        }

        return { type: 'not-eligible' };
    }

    if (offer.plan.Name === PLANS.PASS_LIFETIME) {
        const isEligibilePlan = !getIsB2BAudienceFromSubscription(subscription) && !user.hasPassLifetime;

        if (isEligibilePlan) {
            return okResult();
        }

        return { type: 'not-eligible' };
    }

    return okResult();
};
