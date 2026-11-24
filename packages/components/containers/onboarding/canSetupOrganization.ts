import type { Organization } from '@proton/shared/lib/interfaces/Organization';
import type { UserModel } from '@proton/shared/lib/interfaces/User';
import { hasVisionary } from '@proton/shared/lib/payments/subscription/helpers/plan-matching';

/**
 * Whether the onboarding shows the "set up your organization" step: an admin of a multi-user organization
 * that is not set up yet. Shared by the step renderer and by the apps deciding which steps a user sees.
 */
export const canSetupOrganization = ({
    user,
    organization,
    subscription,
}: {
    user: Pick<UserModel, 'isAdmin'>;
    organization?: Pick<Organization, 'MaxMembers' | 'UsedMembers' | 'HasKeys'>;
    subscription: Parameters<typeof hasVisionary>[0];
}) =>
    user.isAdmin &&
    (organization?.MaxMembers || 0) > 1 &&
    organization?.UsedMembers === 1 &&
    !organization?.HasKeys &&
    !hasVisionary(subscription);
