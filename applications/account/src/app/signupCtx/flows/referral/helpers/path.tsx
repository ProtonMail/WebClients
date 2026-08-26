import { type ADDON_NAMES, PLANS } from '@proton/payments/core/constants';
import type { PlanIDs } from '@proton/payments/core/interface';
import type { PlansMap } from '@proton/payments/core/plan/interface';
import { getPlanFromIDs } from '@proton/payments/core/planIDs';

const getSignupHref = ({
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
