import { useMemo } from 'react';

import { createEntitlementResolver } from '@proton/payments/core/entitlements/resolver';
import { createHooks } from '@proton/redux-utilities/hooks';

import { useAllEntitlements } from '../entitlements/hooks';
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
    const [allEntitlements, loadingEntitlements] = useAllEntitlements();
    const entitlements = useMemo(() => createEntitlementResolver(allEntitlements), [allEntitlements]);

    const loading = loadingUserPermissions || loadingEntitlements;

    if (!userPermissions?.ShowAdminRolesUI) {
        return [AdminRolesUIState.Hidden, loading];
    }

    return [entitlements.orgHasAdminRoles ? AdminRolesUIState.Enabled : AdminRolesUIState.Disabled, loading];
};
