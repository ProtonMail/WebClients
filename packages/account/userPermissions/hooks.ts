import { createHooks } from '@proton/redux-utilities/hooks';
import { useFlag } from '@proton/unleash/useFlag';

import { useEntitlementChecksForOrgAndUser } from '../entitlementCatalog/hooks';
import { useOrganization } from '../organization/hooks';
import { getIsOrganizationOwner } from '../organizationRoles/helpers';
import { useUser } from '../user/hooks';
import { selectUserPermissions, userPermissionsThunk } from './index';

const hooks = createHooks(userPermissionsThunk, selectUserPermissions);

export const useUserPermissions = hooks.useValueWithDefault;

export const useIsOrganizationOwner = (): [boolean, boolean] => {
    const [user] = useUser();
    const [userPermissions, loadingUserPermissions] = useUserPermissions();
    const isAdminRoleMVPEnabled = useFlag('AdminRoleMVP');
    const isOrganizationOwner = getIsOrganizationOwner({
        isAdminRoleMVPEnabled,
        isAdmin: user.isAdmin,
        roles: userPermissions.Roles,
    });
    return [isOrganizationOwner, loadingUserPermissions];
};

export enum AdminRolesUIState {
    Hidden = 'hidden',
    Disabled = 'disabled',
    Enabled = 'enabled',
}

export const useAdminRolesUI = (): [AdminRolesUIState, boolean] => {
    const [userPermissions, loadingUserPermissions] = useUserPermissions();
    const [entitlements, loadingEntitlements] = useEntitlementChecksForOrgAndUser();
    const [organization, loadingOrganization] = useOrganization();
    const isAdminRolesWithMspEnabled = useFlag('AdminRolesWithMSP');

    const loading = loadingUserPermissions || loadingEntitlements || loadingOrganization;

    // Admin Roles is not integrated with MSP, hide its UI for now by FF
    const hideForMSP = organization?.IsSubsidiary && !isAdminRolesWithMspEnabled;
    if (!userPermissions?.ShowAdminRolesUI || hideForMSP) {
        return [AdminRolesUIState.Hidden, loading];
    }

    return [entitlements.hasAdminRoles ? AdminRolesUIState.Enabled : AdminRolesUIState.Disabled, loading];
};
