import { createHooks } from '@proton/redux-utilities';

import { selectUserWalletSettings, userWalletSettingsThunk } from '../slices';

const hooks = createHooks(userWalletSettingsThunk, selectUserWalletSettings);

export const useUserWalletSettings = hooks.useValue;
export const useGetUserWalletSettings = hooks.useGet;
