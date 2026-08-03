import { useEntitlementChecks } from '@proton/payments/core/entitlements/hooks';
import { createHooks } from '@proton/redux-utilities/hooks';
import type { Permission } from '@proton/shared/lib/interfaces/UserPermission';

import { selectUserPermissions, userPermissionsThunk } from './index';

const hooks = createHooks(userPermissionsThunk, selectUserPermissions);

export const useUserPermissions = hooks.useValue;
export const useGetUserPermissions = hooks.useGet;

export const useOrgPermissions = (): [Record<Permission, boolean> | null, boolean] => {
    const [result, loading] = useUserPermissions();
    return [result?.permissions ?? null, loading];
};

export enum AdminRolesUIState {
    Hidden = 'hidden',
    Disabled = 'disabled',
    Enabled = 'enabled',
}

export const useAdminRolesUI = (): [AdminRolesUIState, boolean] => {
    const [userPermissions, loadingUserPermissions] = useUserPermissions();
    const [entitlements, loadingEntitlements] = useEntitlementChecks();

    const loading = loadingUserPermissions || loadingEntitlements;

    if (!userPermissions?.ShowAdminRolesUI) {
        return [AdminRolesUIState.Hidden, loading];
    }

    return [entitlements.orgHasAdminRoles ? AdminRolesUIState.Enabled : AdminRolesUIState.Disabled, loading];
};
