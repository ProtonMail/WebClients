import { ADDON_NAMES } from './constants';
import { CYCLE, PLANS } from './constants';
import { type Cycle, type PlanIDs } from './interface';
import { type Plan, type PlansMap } from './plan/interface';
import { isLifetimePlan } from './subscription/helpers';

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

export function getPrice(planIDs: PlanIDs, cycle: CYCLE, plansMap: PlansMap): number {
    return Object.entries(planIDs).reduce((acc, [planName, quantity]) => {
        const plan = plansMap[planName as keyof typeof plansMap];
        const price = getPricePerCycle(plan, cycle) ?? 0;
        return acc + price * quantity;
    }, 0);
}

export function isMultiUserPersonalPlan(plan: Plan) {
    // even though Duo, Family, Visionary, and Pass Family plans can have up to 6 users in the org,
    // for the price displaying purposes we count it as 1 member.
    const plans = [PLANS.DUO, PLANS.FAMILY, PLANS.VISIONARY, PLANS.PASS_FAMILY];
    return plans.includes(plan.Name as PLANS);
}

export function getPricePerMember(plan: Plan, cycle: CYCLE): number {
    const totalPrice = getPricePerCycle(plan, cycle) || 0;

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

export function getPriceStartsFromPerMonth(plan: Plan, cycle: Cycle, plansMap: PlansMap): number | null {
    const price = getPriceStartsFrom(plan, cycle, plansMap);
    if (price === null) {
        return null;
    }

    if (isLifetimePlan(plan.Name)) {
        return price;
    }

    return price / cycle;
}
