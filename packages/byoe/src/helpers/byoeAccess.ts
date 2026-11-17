import type { EntitlementChecksForOrgAndUser } from '@proton/payments/core/entitlements/interface';
import type { UserModel } from '@proton/shared/lib/interfaces/User';
import { UserType } from '@proton/shared/lib/interfaces/User';
import { isAdmin } from '@proton/shared/lib/user/helpers';

// On B2B plans, only admins can add a BYOE address
// On Visionary/Duo plans, managed users can add a BYOE address only if they are admins. Invited users can add a BYOE address
// Other users can add a BYOE (if the feature flag values are correct)
export const getCanSeeBYOE = ({
    user,
    entitlements,
}: {
    user: UserModel;
    entitlements: EntitlementChecksForOrgAndUser;
}) => {
    const isUserManaged = user.Type === UserType.MANAGED;

    if (entitlements.isB2B || isUserManaged) {
        return isAdmin(user);
    }

    return true;
};
