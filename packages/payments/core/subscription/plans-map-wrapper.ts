import { PLANS, PLAN_TYPES } from '../constants';
import { getFallbackCurrency, isRegionalCurrency } from '../currencies';
import type { Currency, Cycle, PlanIDs } from '../interface';
import { getPlanNameFromIDs } from '../plan/helpers';
import type { Plan, StrictPlan } from '../plan/interface';
import type { FullPlansMap } from './interface';

export function getPlanByName(
    plans: Plan[],
    plan: string | PlanIDs,
    currency: Currency,
    cycle?: Cycle,
    currencyFallback = true,
    ignoreAddons = false
): Plan | undefined {
    const planName = typeof plan === 'string' ? plan : getPlanNameFromIDs(plan);
    if (!planName) {
        return undefined;
    }

    const matchingPlans = plans.filter(
        (plan) =>
            plan.Name === planName &&
            (!cycle || plan.Pricing[cycle] !== undefined) &&
            (!ignoreAddons || plan.Type === PLAN_TYPES.PLAN)
    );

    const currencyMatchingPlan = matchingPlans.find((plan) => plan.Currency === currency);
    if (currencyMatchingPlan) {
        return currencyMatchingPlan;
    }

    if (currencyFallback) {
        const secondaryCurrency = getFallbackCurrency(currency);

        return (
            matchingPlans.find((plan) => plan.Currency === secondaryCurrency) ??
            matchingPlans.find((plan) => !isRegionalCurrency(plan.Currency))
        );
    }
}

export function getStrictPlanByName(
    plans: Plan[],
    planName: string,
    currency: Currency,
    cycle?: Cycle,
    currencyFallback?: boolean
): StrictPlan | undefined {
    return getPlanByName(plans, planName, currency, cycle, currencyFallback, true) as StrictPlan;
}

export function getPlansMap(plans: Plan[], preferredCurrency: Currency, currencyFallback = true): FullPlansMap {
    const byName = new Map<string, Plan[]>();
    for (const plan of plans) {
        if (!plan.Name) {
            continue;
        }
        const group = byName.get(plan.Name);
        if (group) {
            group.push(plan);
        } else {
            byName.set(plan.Name, [plan]);
        }
    }

    const secondaryCurrency = currencyFallback ? getFallbackCurrency(preferredCurrency) : undefined;
    const acc = {} as FullPlansMap;

    for (const matchingPlans of byName.values()) {
        const plan =
            matchingPlans.find((plan) => plan.Currency === preferredCurrency) ??
            (currencyFallback
                ? (matchingPlans.find((plan) => plan.Currency === secondaryCurrency) ??
                  matchingPlans.find((plan) => !isRegionalCurrency(plan.Currency)))
                : undefined);

        if (plan) {
            acc[plan.Name] = plan;
        }
    }

    return acc;
}

export function planToPlanIDs(plan: Plan): PlanIDs {
    if (plan.Name === PLANS.FREE) {
        return {};
    }

    return { [plan.Name]: 1 };
}

export function getAvailableCycles(plan: Plan): Cycle[] {
    return Object.keys(plan.Pricing ?? {}).map((cycle) => +cycle) as Cycle[];
}

export function hasCycle(plan: Plan, cycle: Cycle): boolean {
    return getAvailableCycles(plan).includes(cycle);
}
