import { baseUseSelector as useSelector } from '@proton/react-redux-store';
import { createHooks } from '@proton/redux-utilities/hooks';
import type { Permission } from '@proton/shared/lib/interfaces/UserPermission';
import { useFlag } from '@proton/unleash/useFlag';

import { selectOrgPermissions, selectOrgPermissionsLegacy, selectUserPermissions, userPermissionsThunk } from './index';

const hooks = createHooks(userPermissionsThunk, selectUserPermissions);

export const useUserPermissions = hooks.useValue;
export const useGetUserPermissions = hooks.useGet;

export const useOrgPermissions = (): [Record<Permission, boolean> | null, boolean] => {
    const isRolesAndPermissionsEnabled = useFlag('AdminRoleMVP');
    return useSelector(isRolesAndPermissionsEnabled ? selectOrgPermissions : selectOrgPermissionsLegacy);
};
