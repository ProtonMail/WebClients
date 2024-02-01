import { UserPassPlan } from '@proton/pass/types/api/plan';

export const isPaidPlan = (plan: UserPassPlan) => plan !== UserPassPlan.FREE && plan !== UserPassPlan.TRIAL;
