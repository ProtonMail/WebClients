import { hasNoOrgPermissions } from '@proton/shared/lib/helpers/orgPermissions';
import type { OrganizationExtended } from '@proton/shared/lib/interfaces/Organization';
import type { UserModel } from '@proton/shared/lib/interfaces/User';
import type { OrgPermissions } from '@proton/shared/lib/interfaces/UserPermission';

// The condition under which Account shows its dashboard, and Account and Console show the billing sections.
export const getBillingPageAvailability = ({
    user,
    organization,
    permissions,
}: {
    user: Pick<UserModel, 'isAdmin' | 'isFree' | 'isMember' | 'canPay'>;
    organization: Pick<OrganizationExtended, 'IsSubsidiary'> | undefined;
    permissions: OrgPermissions;
}) => {
    const canAccessBilling = (user.isFree || user.canPay) && !user.isMember;
    // MSP subsidiary orgs have their subscription managed by the MSP manager, so no one in the
    // subsidiary org can edit it: the dashboard and subscription pages should be hidden for everyone.
    const isSubsidiaryOrg = !!organization?.IsSubsidiary;

    // When a user upgrades from free to paid, there is a brief moment when user.isAdmin is true while the org
    // permissions are still all false. Paid users should have at least some permissions, so they are treated as
    // eligible until the actual permission object arrives and the routes are recomputed.
    const isTransitionalState = user.isAdmin && hasNoOrgPermissions(permissions);
    const hasAccountDashboardReadPermission = !!permissions['account.dashboard.read'] || isTransitionalState;

    // There are two paths where the dashboard is shown:
    // 1. (!isAdmin && canAccessBilling): if user can access billing, they can see the dashboard. "!isAdmin" is added
    //  because an admin without `account.dashboard.read` should not see it (e.g. User Admin has isAdmin = true but
    //  their responsibility is CRUD on members and groups only)
    // 2. permissions['account.dashboard.read']: grants the dashboard to any org member who holds the permission
    const dashboard = !isSubsidiaryOrg && ((!user.isAdmin && canAccessBilling) || hasAccountDashboardReadPermission);

    return {
        dashboard,
        // The billing sections themselves also need the user to be able to pay.
        billing: dashboard && !!user.canPay,
    };
};
