import { type ADDON_NAMES, PLANS } from '@proton/payments/core/constants';
import type { PlanIDs } from '@proton/payments/core/interface';
import { getPlanFromIDs } from '@proton/payments/core/planIDs';
import type { PlansMap } from '@proton/shared/lib/payments/plan/interface';

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
