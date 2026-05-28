import { getIsB2BAudienceFromPlan } from '@proton/payments/core/plan/helpers';
import type { Organization, UserModel } from '@proton/shared/lib/interfaces';
import { UserType } from '@proton/shared/lib/interfaces';
import { isAdmin } from '@proton/shared/lib/user/helpers';

// On B2B plans, only admins can add a BYOE address
// On Visionary/Duo plans, managed users can add a BYOE address only if they are admins. Invited users can add a BYOE address
// Other users can add a BYOE (if the feature flag values are correct)
export const getCanSeeBYOE = (user: UserModel, organization?: Organization) => {
    const isB2BUser = getIsB2BAudienceFromPlan(organization?.PlanName);
    const isUserManaged = user.Type === UserType.MANAGED;

    if (isB2BUser || isUserManaged) {
        return isAdmin(user);
    }

    return true;
};
