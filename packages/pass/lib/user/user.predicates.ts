import type { HydratedUserState, UserState } from '@proton/pass/store/reducers';
import { UserPassPlan } from '@proton/pass/types/api/plan';

export const isPaidPlan = (plan: UserPassPlan) => plan !== UserPassPlan.FREE && plan !== UserPassPlan.TRIAL;

export const userStateHydrated = (userState?: UserState): userState is HydratedUserState =>
    userState !== undefined &&
    (['eventId', 'plan', 'user', 'userSettings'] as const).every((key) => userState[key] !== null) &&
    Object.keys(userState.addresses).length > 0;
