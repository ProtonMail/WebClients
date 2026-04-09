import { createHooks } from '@proton/redux-utilities';

import { selectUserPermissions, userPermissionsThunk } from './index';

const hooks = createHooks(userPermissionsThunk, selectUserPermissions);

export const useUserPermissions = hooks.useValue;
export const useGetUserPermissions = hooks.useGet;
