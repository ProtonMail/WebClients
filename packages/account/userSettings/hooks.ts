import { createHooks } from '@proton/redux-utilities';
import type { UserSettings } from '@proton/shared/lib/interfaces';

import { selectUserSettings, userSettingsThunk } from './index';

const hooks = createHooks(userSettingsThunk, selectUserSettings);

// This is technically incorrect but all apps assume that it's preloaded
export const useUserSettings = hooks.useValue as unknown as () => [UserSettings, boolean, any];
export const useGetUserSettings = hooks.useGet;
