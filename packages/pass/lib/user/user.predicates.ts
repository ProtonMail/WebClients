import type { HydratedUserState, UserState } from '@proton/pass/store/reducers';
import { UserPassPlan } from '@proton/pass/types/api/plan';

export const isPaidPlan = (plan: UserPassPlan) => plan !== UserPassPlan.FREE && plan !== UserPassPlan.TRIAL;

/** Ensures that the user state is properly hydrated.
 * When adding new properties to the `UserState`, ensure
 * this function checks for their presence so that we can
 * appropriately re-query the user settings. */
export const userStateHydrated = (state?: UserState): state is HydratedUserState =>
    Boolean(
        state &&
            (['eventId', 'plan', 'user', 'userSettings'] as const).every((key) => state[key] !== null) &&
            Object.keys(state.addresses).length > 0
    );
