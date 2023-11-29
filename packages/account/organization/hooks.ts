import { createHooks } from '@proton/redux-utilities';

import { organizationThunk, selectOrganization } from './index';

const hooks = createHooks(organizationThunk, selectOrganization);

export const useOrganization = hooks.useValue;
export const useGetOrganization = hooks.useGet;
