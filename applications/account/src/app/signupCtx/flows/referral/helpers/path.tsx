import type { ADDON_NAMES, PlanIDs, PlansMap } from '@proton/payments';
import { PLANS, getPlanFromIDs } from '@proton/payments';

export const getSignupHref = ({
    plan,
    targetPath = window.location.pathname,
}: {
    plan: PLANS | ADDON_NAMES;
    targetPath?: string;
}) => {
    const currentParams = new URLSearchParams(window.location.search);

    currentParams.set('plan', plan);

    return `${targetPath}?${currentParams.toString()}`;
};

export const getReferralSignupHrefFromPlanIDs = ({
    planIDs,
    plansMap,
    targetPath = window.location.pathname,
}: {
    planIDs: PlanIDs;
    plansMap: PlansMap;
    targetPath?: string;
}) => {
    const plan = getPlanFromIDs(planIDs, plansMap)?.Name || PLANS.FREE;

    return getSignupHref({ plan, targetPath });
};
