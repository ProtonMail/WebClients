import type { PLANS } from '@proton/payments/core/constants';
import { USER_ROLES } from '@proton/shared/lib/constants';
import type { User } from '@proton/shared/lib/interfaces/User';
import { getIsB2BAudienceFromPlan } from '@proton/shared/lib/payments/plan/helpers';

import type { HydratedUserState, UserState } from '../../store/reducers';
import type { PassPlanResponse } from '../../types/api/pass';
import { UserPassPlan } from '../../types/api/plan';
import type { MaybeNull } from '../../types/utils';

export const isPaidPlan = (plan: UserPassPlan) => plan !== UserPassPlan.FREE;

/** Whether the user should be treated as a B2B audience. Two signals, because
 * neither covers both cases on its own:
 *
 * - the plan's audience, for an active B2B subscription. `User.Role` cannot
 *   answer this: a paid B2C account is `ADMIN_ROLE` too, so a role check alone
 *   would classify Mail Plus (which carries free Pass) as B2B.
 * - `MEMBER_ROLE`, for an organization that has been downgraded to free. The
 *   plan then reads free and the Pass organization state is cleared, but the
 *   role survives, and only an organization member ever holds it.
 *
 * Known gap: the *admin* of a downgraded organization is indistinguishable
 * from a downgraded B2C account client-side, since both are `ADMIN_ROLE` on a
 * free plan. Separating those needs a signal the clients do not have today. */
export const isB2BUser = (user: MaybeNull<User>, plan: MaybeNull<PassPlanResponse>): boolean =>
    getIsB2BAudienceFromPlan((plan?.InternalName as MaybeNull<PLANS>) ?? undefined) ||
    user?.Role === USER_ROLES.MEMBER_ROLE;

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
