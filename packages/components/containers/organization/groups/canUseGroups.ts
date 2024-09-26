import { PLANS } from '@proton/shared/lib/constants';

const groupsCompatiblePlans = new Set([
    PLANS.MAIL_BUSINESS,
    PLANS.BUNDLE_PRO,
    PLANS.BUNDLE_PRO_2024,
    PLANS.VISIONARY,
    PLANS.ENTERPRISE,
]);

const canUseGroups = (plan: PLANS | undefined) => plan !== undefined && groupsCompatiblePlans.has(plan);

export default canUseGroups;
