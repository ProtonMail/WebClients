import { USER_ROLES } from '@proton/shared/lib/constants';

import type { UserAndOrganizationForSubscriptions } from '../core/entitlements/unreadable-subscriptions';

export const regularAdmin: UserAndOrganizationForSubscriptions = {
    user: { Role: USER_ROLES.ADMIN_ROLE },
    organization: { IsSubsidiary: false },
};
