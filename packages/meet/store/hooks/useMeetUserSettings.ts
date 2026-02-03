import { createHooks } from '@proton/redux-utilities';

import { selectUserSettings, userSettingsThunk } from '../slices';

const hooks = createHooks(userSettingsThunk, selectUserSettings);

export const useMeetUserSettings = hooks.useValue;
export const useGetMeetUserSettings = hooks.useGet;
