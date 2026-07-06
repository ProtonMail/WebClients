import { type ADDON_NAMES, PLANS } from '@proton/payments/core/constants';
import type { Currency, Cycle, PlanIDs } from '@proton/payments/core/interface';
import type { PlansMap } from '@proton/payments/core/plan/interface';
import { getPlanFromIDs } from '@proton/payments/core/planIDs';

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
