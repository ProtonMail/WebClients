import { useEntitlementChecks } from '@proton/payments-ui/entitlements/hooks';
import { createHooks } from '@proton/redux-utilities/hooks';

import { selectUserPermissions, userPermissionsThunk } from './index';

const hooks = createHooks(userPermissionsThunk, selectUserPermissions);

export const useUserPermissions = hooks.useValueWithDefault;

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
