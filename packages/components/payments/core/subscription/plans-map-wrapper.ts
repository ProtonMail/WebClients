import { PLANS, PLAN_TYPES } from '@proton/shared/lib/constants';
import type { BasePlansMap, Currency, Cycle, Plan, PlanIDs, StrictPlan } from '@proton/shared/lib/interfaces';

import { getFallbackCurrency, isRegionalCurrency } from '../helpers';

export function getPlan(
    plans: Plan[],
    planName: string,
    currency: Currency,
    cycle?: Cycle,
    currencyFallback = true,
    ignoreAddons = false
): Plan | undefined {
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

export function getStrictPlan(
    plans: Plan[],
    planName: string,
    currency: Currency,
    cycle?: Cycle,
    currencyFallback?: boolean
): StrictPlan | undefined {
    return getPlan(plans, planName, currency, cycle, currencyFallback, true) as StrictPlan;
}

export function hasPlan(plans: Plan[], planName: string, currency: Currency, cycle: Cycle | undefined): boolean {
    return !!getPlan(plans, planName, currency, cycle, false);
}

export interface MappedPlan extends Plan {
    availableCurrencies: Currency[];
}

export type FullPlansMap = BasePlansMap<MappedPlan>;

export function getPlansMap(plans: Plan[], preferredCurrency: Currency, currencyFallback = true): FullPlansMap {
    const planNames = [...new Set(plans.map(({ Name }) => Name))];

    return planNames.reduce<FullPlansMap>((acc, planName) => {
        const plan = getPlan(plans, planName, preferredCurrency, undefined, currencyFallback);

        if (plan) {
            const availableCurrencies = [
                ...new Set(plans.filter(({ Name }) => Name === planName).map(({ Currency }) => Currency)),
            ];

            const mappedPlan: MappedPlan = {
                ...plan,
                availableCurrencies,
            };

            acc[plan.Name] = mappedPlan;
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
