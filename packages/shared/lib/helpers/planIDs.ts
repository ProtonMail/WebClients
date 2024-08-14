import type { SelectedPlan } from '@proton/components/payments/core';

import { ADDON_NAMES, CYCLE, PLANS, PLAN_TYPES } from '../constants';
import type { Organization, Plan, PlanIDs, PlansMap, SubscriptionCheckResponse, User } from '../interfaces';
import { ChargebeeEnabled, getMaxValue } from '../interfaces';
import { getSupportedAddons, getSupportedB2BAddons, isDomainAddon, isMemberAddon, isScribeAddon } from './addons';
import type { AggregatedPricing, PricingForCycles } from './subscription';
import { allCycles, getPlanMembers, getPricePerCycle, getPricePerMember } from './subscription';

export const hasPlanIDs = (planIDs: PlanIDs) => Object.values(planIDs).some((quantity) => quantity > 0);

export const clearPlanIDs = (planIDs: PlanIDs): PlanIDs => {
    return Object.entries(planIDs).reduce<PlanIDs>((acc, [planName, quantity = 0]) => {
        if (quantity <= 0) {
            return acc;
        }
        acc[planName as keyof PlanIDs] = quantity;
        return acc;
    }, {});
};

export const getPlanFromCheckout = (planIDs: PlanIDs, plansMap: PlansMap): Plan | null => {
    const planNames = Object.keys(planIDs) as (keyof PlanIDs)[];
    for (const planName of planNames) {
        const plan = plansMap[planName];
        if (plan?.Type === PLAN_TYPES.PLAN) {
            return plan;
        }
    }

    return null;
};

/**
 * Transfer addons from one plan to another. In different plans, addons have different names
 * and potentially different resource limits, so they must be converted manually using this function.
 *
 * @returns
 */
export const switchPlan = ({
    planIDs,
    planID,
    organization,
    plans,
    user,
}: {
    planIDs: PlanIDs;
    planID?: PLANS | ADDON_NAMES;
    organization?: Organization;
    plans: Plan[];
    user: User | undefined;
}): PlanIDs => {
    if (planID === undefined) {
        return {};
    }

    const newPlanIDs = { [planID]: 1 };
    const supportedAddons = getSupportedAddons(newPlanIDs);

    // Transfer addons
    (Object.keys(supportedAddons) as ADDON_NAMES[]).forEach((addon) => {
        const quantity = planIDs[addon as keyof PlanIDs];

        if (quantity) {
            newPlanIDs[addon] = quantity;
        }

        const plan = plans.find(({ Name }) => Name === planID);

        // Transfer member addons
        if (isMemberAddon(addon) && plan && organization) {
            const memberAddon = plans.find(({ Name }) => Name === addon);

            if (memberAddon) {
                // Find out the smallest number of member addons that could accommodate the previously known usage
                // of the resources. For example, if the user had 5 addresses, and each member addon only
                // provides 1 additional address, then we would need to add 5 member addons to cover the previous
                // usage. The maximum is chosen across all types of resources (space, addresses, VPNs, members,
                // calendars) so as to ensure that the new plan covers the maximum usage of any single resource.
                // In addition, we explicitely check how many members were used previously.

                const diffSpace =
                    ((organization.UsedMembers > 1 ? organization.AssignedSpace : organization.UsedSpace) || 0) -
                    plan.MaxSpace; // AssignedSpace is the space assigned to members in the organization which count for addon transfer
                const memberAddonsWithEnoughSpace =
                    diffSpace > 0 && memberAddon.MaxSpace ? Math.ceil(diffSpace / memberAddon.MaxSpace) : 0;

                const diffAddresses = (organization.UsedAddresses || 0) - plan.MaxAddresses;
                const memberAddonsWithEnoughAddresses =
                    diffAddresses > 0 && memberAddon.MaxAddresses
                        ? Math.ceil(diffAddresses / memberAddon.MaxAddresses)
                        : 0;

                const diffVPN = (organization.UsedVPN || 0) - plan.MaxVPN;
                const memberAddonsWithEnoughVPNConnections =
                    diffVPN > 0 && memberAddon.MaxVPN ? Math.ceil(diffVPN / memberAddon.MaxVPN) : 0;

                const diffMembers = (organization.UsedMembers || 0) - plan.MaxMembers;
                const memberAddonsWithEnoughMembers =
                    diffMembers > 0 && memberAddon.MaxMembers ? Math.ceil(diffMembers / memberAddon.MaxMembers) : 0;

                const diffCalendars = (organization.UsedCalendars || 0) - plan.MaxCalendars;
                const memberAddonsWithEnoughCalendars =
                    diffCalendars > 0 && memberAddon.MaxCalendars
                        ? Math.ceil(diffCalendars / memberAddon.MaxCalendars)
                        : 0;

                // count all available member addons in the new planIDs selection
                let memberAddons = 0;
                for (const addonName of Object.values(ADDON_NAMES)) {
                    if (isMemberAddon(addonName)) {
                        memberAddons += planIDs[addonName] ?? 0;
                    }
                }

                newPlanIDs[addon] = Math.max(
                    memberAddonsWithEnoughSpace,
                    memberAddonsWithEnoughAddresses,
                    memberAddonsWithEnoughVPNConnections,
                    memberAddonsWithEnoughMembers,
                    memberAddonsWithEnoughCalendars,
                    memberAddons
                );
            }
        }

        // Transfer domain addons
        if (isDomainAddon(addon) && plan && organization) {
            const domainAddon = plans.find(({ Name }) => Name === addon);
            const diffDomains = (organization.UsedDomains || 0) - plan.MaxDomains;

            if (domainAddon) {
                newPlanIDs[addon] = Math.max(
                    diffDomains > 0 && domainAddon.MaxDomains ? Math.ceil(diffDomains / domainAddon.MaxDomains) : 0,
                    (planIDs[ADDON_NAMES.DOMAIN_ENTERPRISE] || 0) + (planIDs[ADDON_NAMES.DOMAIN_BUNDLE_PRO] || 0)
                );
            }
        }

        // In case if we have inhouse Visionary user with non-zero UsedAI and they can't use Chargebee yet
        // (e.g. because of Business flag) then we forbid transfering Scribe addons, because it will go to v4 payments
        // which don't support scribe.
        const canTransferScribe = user?.ChargebeeUser !== ChargebeeEnabled.INHOUSE_FORCED;

        if (isScribeAddon(addon) && plan && organization && canTransferScribe) {
            const gptAddon = plans.find(({ Name }) => Name === addon);
            const diffAIs = (organization.UsedAI || 0) - getMaxValue(plan, 'MaxAI');

            if (gptAddon) {
                const gptAddonsWithEnoughSeats =
                    diffAIs > 0 && getMaxValue(gptAddon, 'MaxAI')
                        ? Math.ceil(diffAIs / getMaxValue(gptAddon, 'MaxAI'))
                        : 0;

                // let count all available GPT addons in the new planIDs selection
                let gptAddons = 0;
                for (const addonName of Object.values(ADDON_NAMES)) {
                    if (isScribeAddon(addonName)) {
                        gptAddons += planIDs[addonName] ?? 0;
                    }
                }

                newPlanIDs[addon] = Math.max(gptAddonsWithEnoughSeats, gptAddons);
            }
        }

        // '1ip' case remains unhandled. We currently have only one plan with an IP addon, so for now it is not transferable.
        // When/if we have the other plans with the same addon type, then it must be handled here.
    });

    return clearPlanIDs(newPlanIDs);
};

export const setQuantity = (planIDs: PlanIDs, planID: PLANS | ADDON_NAMES, newQuantity: number) => {
    const { [planID]: removedPlan, ...restPlanIDs } = planIDs;
    if (!newQuantity || newQuantity <= 0) {
        return restPlanIDs;
    }
    return {
        ...restPlanIDs,
        [planID]: newQuantity,
    };
};

export const supportB2BAddons = (planIDs: PlanIDs) => {
    const supportedAddons = getSupportedB2BAddons(planIDs);
    return !!Object.keys(supportedAddons).length;
};

export const getPlanFromPlanIDs = (plansMap: PlansMap, planIDs: PlanIDs = {}): (Plan & { Name: PLANS }) | undefined => {
    const planID = Object.keys(planIDs).find((planID): planID is keyof PlansMap => {
        return plansMap[planID as keyof PlansMap]?.Type === PLAN_TYPES.PLAN;
    });
    if (planID) {
        return plansMap[planID] as Plan & { Name: PLANS };
    }
};
export function getPlanNameFromIDs(planIDs: PlanIDs): PLANS | undefined {
    const availableKeys = Object.keys(planIDs);
    return Object.values(PLANS).find((value) => availableKeys.includes(value));
}
export function getPlanFromIds(planIDs: PlanIDs): PLANS | undefined {
    return Object.values(PLANS).find((key) => {
        // If the planIDs object has non-zero value for the plan, then it exists.
        // There can be at most 1 plan, and others are addons.
        const planNumber = planIDs[key as PLANS] ?? 0;
        return planNumber > 0;
    });
}
export const getPricingFromPlanIDs = (planIDs: PlanIDs, plansMap: PlansMap): AggregatedPricing => {
    const initial = {
        [CYCLE.MONTHLY]: 0,
        [CYCLE.YEARLY]: 0,
        [CYCLE.THREE]: 0,
        [CYCLE.EIGHTEEN]: 0,
        [CYCLE.TWO_YEARS]: 0,
        [CYCLE.FIFTEEN]: 0,
        [CYCLE.THIRTY]: 0,
    };

    return Object.entries(planIDs).reduce<AggregatedPricing>(
        (acc, [planName, quantity]) => {
            const plan = plansMap[planName as keyof PlansMap];
            if (!plan) {
                return acc;
            }

            const members = getPlanMembers(plan, quantity);
            acc.membersNumber += members;

            const add = (target: PricingForCycles, cycle: CYCLE) => {
                const price = getPricePerCycle(plan, cycle);
                if (price) {
                    target[cycle] += quantity * price;
                }
            };

            const addMembersPricing = (target: PricingForCycles, cycle: CYCLE) => {
                const price = getPricePerMember(plan, cycle);
                if (price) {
                    target[cycle] += members * price;
                }
            };

            allCycles.forEach((cycle) => {
                add(acc.all, cycle);
            });

            if (members !== 0) {
                allCycles.forEach((cycle) => {
                    addMembersPricing(acc.members, cycle);
                });
            }

            if (plan.Type === PLAN_TYPES.PLAN) {
                allCycles.forEach((cycle) => {
                    add(acc.plans, cycle);
                });

                acc.defaultMonthlyPriceWithoutAddons += quantity * (getPricePerCycle(plan, CYCLE.MONTHLY) ?? 0);
            }

            const defaultMonthly = plan.DefaultPricing?.[CYCLE.MONTHLY] ?? 0;
            const monthly = getPricePerCycle(plan, CYCLE.MONTHLY) ?? 0;

            // Offers might affect Pricing both ways, increase and decrease.
            // So if the Pricing increases, then we don't want to use the lower DefaultPricing as basis
            // for discount calculations
            const price = Math.max(defaultMonthly, monthly);

            acc.defaultMonthlyPrice += quantity * price;

            return acc;
        },
        {
            defaultMonthlyPrice: 0,
            defaultMonthlyPriceWithoutAddons: 0,
            all: { ...initial },
            members: {
                ...initial,
            },
            plans: {
                ...initial,
            },
            membersNumber: 0,
        }
    );
};

export type PricingMode = 'all' | 'plans';

export type TotalPricing = ReturnType<typeof getTotalFromPricing>;

// todo: replace signature with SelectedPlan only
export const getTotalFromPricing = (
    pricing: AggregatedPricing,
    cycle: CYCLE,
    mode: PricingMode = 'all',
    additionalCheckResults?: SubscriptionCheckResponse[],
    selectedPlan?: SelectedPlan
) => {
    type CheckedPrices = Record<
        CYCLE,
        {
            Amount: number;
            CouponDiscount: number;
        }
    >;

    const checkedPrices =
        additionalCheckResults?.reduce((acc, { CouponDiscount = 0, Cycle, Amount }) => {
            acc[Cycle] = {
                Amount,
                CouponDiscount,
            };

            return acc;
        }, {} as CheckedPrices) ?? ({} as CheckedPrices);

    const { defaultMonthlyPrice, defaultMonthlyPriceWithoutAddons } = pricing;

    const total = checkedPrices[cycle]?.Amount ?? pricing[mode][cycle];

    let couponDiscount = checkedPrices[cycle]?.CouponDiscount ?? 0;
    if (couponDiscount < 0) {
        couponDiscount = -couponDiscount;
    }

    const discountedTotal = total - couponDiscount;
    const totalPerMonth = discountedTotal / cycle;

    const price = mode === 'all' ? defaultMonthlyPrice : defaultMonthlyPriceWithoutAddons;
    const totalNoDiscount = price * cycle;
    const discount = cycle === CYCLE.MONTHLY ? 0 : totalNoDiscount - discountedTotal;

    const membersPricePerMonthWithoutDiscount = Math.floor(pricing.members[cycle] / cycle);
    const memberShare = membersPricePerMonthWithoutDiscount / (total / cycle);
    const membersDiscount = Math.floor(couponDiscount * memberShare);
    const discountPerUserPerMonth = membersDiscount / pricing.membersNumber / cycle;
    const perUserPerMonth = membersPricePerMonthWithoutDiscount / pricing.membersNumber - discountPerUserPerMonth;

    const viewPricePerMonth = selectedPlan?.isB2BPlan() ? perUserPerMonth : totalPerMonth;

    return {
        discount,
        discountPercentage: discount > 0 ? Math.round((discount / totalNoDiscount) * 100) : 0,
        discountedTotal,
        totalPerMonth,
        totalNoDiscountPerMonth: totalNoDiscount / cycle,
        perUserPerMonth,
        viewPricePerMonth,
    };
};

export type TotalPricings = {
    [key in CYCLE]: TotalPricing;
};

export function getTotals(
    planIDs: PlanIDs,
    plansMap: PlansMap,
    additionalCheckResults: SubscriptionCheckResponse[],
    mode?: PricingMode,
    selectedPlan?: SelectedPlan
): TotalPricings {
    const pricing = getPricingFromPlanIDs(planIDs, plansMap);

    return allCycles.reduce<{ [key in CYCLE]: TotalPricing }>((acc, cycle) => {
        acc[cycle] = getTotalFromPricing(pricing, cycle, mode, additionalCheckResults, selectedPlan);
        return acc;
    }, {} as any);
}

export function planIDsPositiveDifference(oldPlanIDs: PlanIDs, newPlanIDs: PlanIDs): PlanIDs {
    if (!oldPlanIDs || !newPlanIDs) {
        return {};
    }

    const increasedPlanIDs: PlanIDs = {};

    for (const key of Object.keys(newPlanIDs) as (keyof PlanIDs)[]) {
        const newQuantity = newPlanIDs[key] ?? 0;
        const oldQuantity = oldPlanIDs[key] ?? 0;

        const increase = newQuantity - oldQuantity;
        if (increase > 0) {
            increasedPlanIDs[key] = increase;
        }
    }

    return increasedPlanIDs;
}
