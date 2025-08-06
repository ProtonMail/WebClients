import { createHooks } from '@proton/redux-utilities';

import { selectUserSettings, userSettingsThunk } from '../slices';

const hooks = createHooks(userSettingsThunk, selectUserSettings);

export const useUserSettings = hooks.useValue;
export const useGetUserSettings = hooks.useGet;
