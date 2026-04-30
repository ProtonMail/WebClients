import { createHooks } from '@proton/redux-utilities/hooks';

import { apiWalletsDataThunk, selectApiWalletsData } from '../slices';

const hooks = createHooks(apiWalletsDataThunk, selectApiWalletsData);

export const useApiWalletsData = hooks.useValue;
export const useGetApiWalletsData = hooks.useGet;
