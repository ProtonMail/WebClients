import { createHooks } from '@proton/redux-utilities';

import { organizationRolesThunk, selectOrganizationRoles } from './index';

const hooks = createHooks(organizationRolesThunk, selectOrganizationRoles);

export const useOrganizationRoles = hooks.useValue;
export const useGetOrganizationRoles = hooks.useGet;
