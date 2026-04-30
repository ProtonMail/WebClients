import { createHooks } from '@proton/redux-utilities/hooks';

import { selectWalletSettings, walletSettingsThunk } from '../slices/walletSettings';

const hooks = createHooks(walletSettingsThunk, selectWalletSettings);

export const useWalletSettings = hooks.useValue;
export const useGetWalletSettings = hooks.useGet;
