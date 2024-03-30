import { UserPassPlan } from '@proton/pass/types/api/plan';
import type { User } from '@proton/shared/lib/interfaces/User';
import { isAdmin } from '@proton/shared/lib/user/helpers';

export const isB2BAdmin = (user: User, passPlan: UserPassPlan) => isAdmin(user) && passPlan === UserPassPlan.BUSINESS;
export const isBusinessPlan = (passPlan: UserPassPlan) => passPlan === UserPassPlan.BUSINESS;
