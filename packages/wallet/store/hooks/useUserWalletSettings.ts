import type { WasmUserSettings } from '@proton/andromeda';
import { createHooks } from '@proton/redux-utilities';

import { selectUserWalletSettings, userWalletSettingsThunk } from '../slices';
import { DEFAULT_SETTINGS } from '../slices/userWalletSettings';

const hooks = createHooks(userWalletSettingsThunk, selectUserWalletSettings);

export const useGetUserWalletSettings = hooks.useGet;

export const useUserWalletSettings = (): [WasmUserSettings, boolean] => {
    const [value, loadingValue] = hooks.useValue();
    return [value ?? DEFAULT_SETTINGS, loadingValue];
};
