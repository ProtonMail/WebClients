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
