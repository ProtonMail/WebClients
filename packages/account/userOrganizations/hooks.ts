import { createHooks } from '@proton/redux-utilities/hooks';

import { selectUserOrganizations, userOrganizationsThunk } from './index';

const hooks = createHooks(userOrganizationsThunk, selectUserOrganizations);

export const useUserOrganizations = hooks.useValue;
export const useGetUserOrganizations = hooks.useGet;
