import type { ADDON_NAMES, PlanIDs, PlansMap } from '@proton/payments';
import { type Currency, type Cycle, PLANS, getPlanFromIDs } from '@proton/payments';

export const getSignupHref = ({
    plan,
    cycle,
    currency,

    targetPath = window.location.pathname,
}: {
    plan: PLANS | ADDON_NAMES;
    cycle: Cycle;
    currency: Currency;

    targetPath?: string;
}) => {
    const currentParams = new URLSearchParams(window.location.search);

    currentParams.set('mode', 'ctx');
    currentParams.set('plan', plan);
    currentParams.set('cycle', cycle.toString());
    currentParams.set('currency', currency);

    return `${targetPath}?${currentParams.toString()}`;
};

export const getSignupHrefFromPlanIDs = ({
    planIDs,
    cycle,
    currency,
    plansMap,
    targetPath = window.location.pathname,
}: {
    planIDs: PlanIDs;
    cycle: Cycle;
    currency: Currency;
    plansMap: PlansMap;
    targetPath?: string;
}) => {
    const plan = getPlanFromIDs(planIDs, plansMap)?.Name || PLANS.FREE;

    return getSignupHref({ plan, cycle, currency, targetPath });
};
