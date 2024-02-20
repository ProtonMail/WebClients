import { createHooks } from '@proton/redux-utilities';

import { selectUserWallets, userWalletsThunk } from '../slices';

const hooks = createHooks(userWalletsThunk, selectUserWallets);

export const useUserWallets = hooks.useValue;
export const useGetUserWallets = hooks.useGet;
