import { isLifetimePlan, isMultiUserPersonalPlan } from '@proton/shared/lib/payments/plan/helpers';
import type { Plan, PlansMap } from '@proton/shared/lib/payments/plan/interface';

import { ADDON_NAMES, CYCLE, PLANS } from './constants';
import type { Cycle, PlanIDs, Pricing } from './interface';
import { allCycles, customCycles } from './subscription/helpers';

export const INCLUDED_IP_PRICING = {
    [CYCLE.MONTHLY]: 4999,
    [CYCLE.YEARLY]: 3999 * CYCLE.YEARLY,
    [CYCLE.TWO_YEARS]: 3599 * CYCLE.TWO_YEARS,
};

function getIpPrice(cycle: CYCLE): number {
    if (cycle === CYCLE.MONTHLY) {
        return INCLUDED_IP_PRICING[CYCLE.MONTHLY];
    }

    if (cycle === CYCLE.YEARLY) {
        return INCLUDED_IP_PRICING[CYCLE.YEARLY];
    }

    if (cycle === CYCLE.TWO_YEARS) {
        return INCLUDED_IP_PRICING[CYCLE.TWO_YEARS];
    }

    return 0;
}

export function getIpPricePerMonth(cycle: CYCLE): number {
    return getIpPrice(cycle) / cycle;
}

export function getPricePerCycle(plan: Plan | undefined, cycle: CYCLE) {
    return plan?.Pricing?.[cycle];
}

/**
 * Gets the pricing of a plan without its offer. Plans loaded with an offer carry the offer price in `Pricing` and the
 * regular price in `DefaultPricing`, while the subscription check always starts from the regular price and returns the
 * offer as a separate discount.
 *
 * @param plan - Plan or addon, loaded with or without an offer.
 * @returns `DefaultPricing` when the plan carries an offer, otherwise `Pricing`.
 */
export function getRegularPricing(plan: Plan): Pricing {
    const carriesOffer = Object.keys(plan.Offers ?? {}).length > 0;
    return carriesOffer ? plan.DefaultPricing : plan.Pricing;
}

/**
 * Sums the price of the selected plans and addons for a cycle.
 *
 * @param planIDs - Selected plans and addons with their quantities.
 * @param cycle - Billing cycle to price.
 * @param plansMap - Plans and addons by name.
 * @param options
 * @param options.priceType - Which price to sum: `current` (default) reads `Pricing`, `regular` reads the price
 *   without the offer for plans loaded with one (see {@link getRegularPricing}).
 * @returns The total price in cents, counting 0 for a plan or cycle that is not in the map.
 */
export function getPrice(
    planIDs: PlanIDs,
    cycle: CYCLE,
    plansMap: PlansMap,
    { priceType = 'current' }: { priceType?: 'current' | 'regular' } = {}
): number {
    return Object.entries(planIDs).reduce((acc, [planName, quantity]) => {
        const plan = plansMap[planName as keyof typeof plansMap];
        if (!plan) {
            return acc;
        }
        const pricing = priceType === 'regular' ? getRegularPricing(plan) : plan?.Pricing;
        const price = pricing[cycle] ?? 0;
        return acc + price * quantity;
    }, 0);
}

function getPricePerMember(plan: Plan, cycle: CYCLE): number {
    const totalPrice = getRegularPricing(plan)?.[cycle] || 0;

    if (plan.Name === PLANS.VPN_BUSINESS) {
        // For VPN business, we exclude IP price from calculation. And we also divide by 2,
        // because it has 2 members by default too.
        const IP_PRICE = getIpPrice(cycle);
        return (totalPrice - IP_PRICE) / (plan.MaxMembers || 1);
    }

    if (isMultiUserPersonalPlan(plan)) {
        return totalPrice;
    }

    // Some plans have 0 MaxMembers. That's because they don't have access to mail.
    // In reality, they still get 1 member.
    return totalPrice / (plan.MaxMembers || 1);
}

export function getPriceStartsFrom(plan: Plan, cycle: Cycle, plansMap: PlansMap): number | null {
    if (isLifetimePlan(plan.Name)) {
        return getPricePerCycle(plan, CYCLE.YEARLY) ?? getPricePerCycle(plan, CYCLE.MONTHLY) ?? null;
    }

    const price = getPricePerCycle(plan, cycle);
    if (price === undefined) {
        return null;
    }

    const plansThatMustUseAddonPricing = {
        [PLANS.VPN_PRO]: ADDON_NAMES.MEMBER_VPN_PRO,
        [PLANS.VPN_BUSINESS]: ADDON_NAMES.MEMBER_VPN_BUSINESS,
        [PLANS.PASS_PRO]: ADDON_NAMES.MEMBER_PASS_PRO,
        [PLANS.PASS_BUSINESS]: ADDON_NAMES.MEMBER_PASS_BUSINESS,
    };
    type PlanWithAddon = keyof typeof plansThatMustUseAddonPricing;

    // If the current plan is one of those that must use addon pricing,
    // then we find the matching addon object and return its price
    for (const planWithAddon of Object.keys(plansThatMustUseAddonPricing) as PlanWithAddon[]) {
        if (plan.Name !== planWithAddon) {
            continue;
        }

        const addonName = plansThatMustUseAddonPricing[planWithAddon];
        const memberAddon = plansMap[addonName];
        const memberPrice = memberAddon ? getPricePerCycle(memberAddon, cycle) : undefined;
        if (memberPrice === undefined) {
            continue;
        }

        return memberPrice;
    }

    return price;
}

export function getPricingPerMember(plan: Plan): Pricing {
    return allCycles.reduce((acc, cycle) => {
        acc[cycle] = getPricePerMember(plan, cycle);

        // If the plan doesn't have custom cycles, we need to remove it from the resulting Pricing object
        const isNonDefinedCycle = acc[cycle] === undefined || acc[cycle] === null || acc[cycle] === 0;
        if (customCycles.includes(cycle) && isNonDefinedCycle) {
            delete acc[cycle];
        }

        return acc;
    }, {} as Pricing);
}
