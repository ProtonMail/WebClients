import { createHooks } from '@proton/redux-utilities';

import { organizationKeyThunk, selectOrganizationKey } from './index';

const hooks = createHooks(organizationKeyThunk, selectOrganizationKey);

export const useOrganizationKey = hooks.useValue;
export const useGetOrganizationKey = hooks.useGet;
