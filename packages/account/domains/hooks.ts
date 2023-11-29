import { createHooks } from '@proton/redux-utilities';

import { domainsThunk, selectDomains } from './index';

const hooks = createHooks(domainsThunk, selectDomains);

export const useCustomDomains = hooks.useValue;
export const useGetCustomDomains = hooks.useGet;
