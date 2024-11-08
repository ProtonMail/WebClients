import { getPlanNameFromIDs } from '@proton/shared/lib/helpers/planIDs';
import type { Cycle, Plan, StrictPlan } from '@proton/shared/lib/interfaces';

import { PLANS, PLAN_TYPES } from '../constants';
import { getFallbackCurrency, isRegionalCurrency } from '../helpers';
import { type Currency, type PlanIDs } from '../interface';
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

export function planExists(plans: Plan[], planName: string, currency: Currency, cycle: Cycle | undefined): boolean {
    return !!getPlanByName(plans, planName, currency, cycle, false);
}

export function getPlansMap(plans: Plan[], preferredCurrency: Currency, currencyFallback = true): FullPlansMap {
    const planNames = [...new Set(plans.map(({ Name }) => Name))];

    return planNames.reduce<FullPlansMap>((acc, planName) => {
        const plan = getPlanByName(plans, planName, preferredCurrency, undefined, currencyFallback);

        if (plan) {
            acc[plan.Name] = plan;
        }

        return acc;
    }, {} as FullPlansMap);
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
