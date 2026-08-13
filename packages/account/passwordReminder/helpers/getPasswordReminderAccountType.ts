import { hasOrganizationSetup, hasOrganizationSetupWithKeys } from '@proton/shared/lib/helpers/organization';
import type { OrganizationExtended, UserModel } from '@proton/shared/lib/interfaces';
import { getOrganizationDenomination } from '@proton/shared/lib/organization/helper';

/**
 * Which segment a user belongs to for password check-in purposes.
 *
 * This is the single source of truth for the segmentation: it decides both which
 * feature gate applies (see `getIsPasswordReminderAvailable`) and which segment
 * the telemetry events are attributed to, so the two can never disagree.
 */
export type PasswordReminderAccountType = 'individual' | 'organization' | 'family';

export const getPasswordReminderAccountType = ({
    user,
    organization,
}: {
    user: UserModel;
    organization?: OrganizationExtended;
}): PasswordReminderAccountType => {
    // Family groups (Family, Duo, Pass Family) are organizations technically, but the org
    // rollout flag doesn't apply to them: they keep the individual behaviour.
    if (getOrganizationDenomination(organization) === 'familyGroup') {
        return 'family';
    }

    const isOrgConfigured = hasOrganizationSetupWithKeys(organization) || hasOrganizationSetup(organization);

    // `isAdmin` is true for any paying account, whether or not it has an organization —
    // it's what gates the "set up organization" flow — so an admin only counts as
    // belonging to one once that organization has actually been configured.
    if (user.isMember || (user.isAdmin && isOrgConfigured)) {
        return 'organization';
    }

    return 'individual';
};
