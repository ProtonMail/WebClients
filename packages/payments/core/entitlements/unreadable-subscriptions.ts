import { USER_ROLES } from '@proton/shared/lib/constants';
import type { Organization } from '@proton/shared/lib/interfaces/Organization';
import type { User } from '@proton/shared/lib/interfaces/User';

/**
 * Why the current user can't read the subscriptions of their organization.
 *
 * In both cases the organization entitlements stand in for the subscriptions: they are everything the organization
 * gets, from its own subscription or, for an MSP subsidiary, from what the parent organization assigns.
 *
 * - `msp-subsidiary`: any user of an MSP subsidiary organization, admins included. A subsidiary usually has no
 *   subscription of its own: its entitlements are copied from the parent organization, without the subsidiary
 *   entitlements, and the subscription request fails even for its admins. MSP subsidiaries may need a different
 *   handling in the future, so keep this case separate from `member`.
 * - `member`: a non-admin member of an organization. Multi-user plans are not compatible with multiple subscriptions,
 *   so the organization has exactly one subscription, and its organization entitlements describe it.
 */
export type UnreadableSubscriptionsReason = 'msp-subsidiary' | 'member';

export type UserAndOrganizationForSubscriptions = {
    user: Pick<User, 'Role'>;
    organization: Pick<Organization, 'IsSubsidiary'> | undefined;
};

export const getUnreadableSubscriptionsReason = ({
    user,
    organization,
}: UserAndOrganizationForSubscriptions): UnreadableSubscriptionsReason | undefined => {
    if (organization?.IsSubsidiary) {
        return 'msp-subsidiary';
    }

    if (user.Role === USER_ROLES.MEMBER_ROLE) {
        return 'member';
    }

    return undefined;
};
