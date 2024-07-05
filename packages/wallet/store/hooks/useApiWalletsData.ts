import { createHooks } from '@proton/redux-utilities';

import { apiWalletsDataThunk, selectApiWalletsData } from '../slices';

const hooks = createHooks(apiWalletsDataThunk, selectApiWalletsData);

export const useApiWalletsData = hooks.useValue;
export const useGetApiWalletsData = hooks.useGet;
