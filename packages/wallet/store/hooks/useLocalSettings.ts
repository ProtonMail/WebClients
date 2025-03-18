import { createHooks } from '@proton/redux-utilities';

import { selectSettings, settingsThunk } from '../slices';

const hooks = createHooks(settingsThunk, selectSettings);

export const useSettings = hooks.useValue;
export const useGetSettings = hooks.useGet;
