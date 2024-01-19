import { createHooks } from '@proton/redux-utilities';

import { addressesThunk, selectAddresses } from './index';

const hooks = createHooks(addressesThunk, selectAddresses);

export const useAddresses = hooks.useValue;
export const useGetAddresses = hooks.useGet;
