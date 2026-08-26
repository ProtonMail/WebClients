import { createHooks } from '@proton/redux-utilities/hooks';

import { organizationRolesThunk, selectOrganizationRoles } from './index';

const hooks = createHooks(organizationRolesThunk, selectOrganizationRoles);

export const useOrganizationRoles = hooks.useValue;
