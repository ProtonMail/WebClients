import { PLANS } from '@proton/payments';

const groupsCompatiblePlans = new Set([PLANS.MAIL_BUSINESS, PLANS.BUNDLE_PRO, PLANS.BUNDLE_PRO_2024, PLANS.VISIONARY]);

const canUseGroups = (plan: PLANS | undefined) => plan !== undefined && groupsCompatiblePlans.has(plan);

export default canUseGroups;
