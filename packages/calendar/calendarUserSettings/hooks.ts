import { createHooks } from '@proton/redux-utilities';

import { calendarSettingsThunk, selectCalendarUserSettings } from './index';

const hooks = createHooks(calendarSettingsThunk, selectCalendarUserSettings);

export const useCalendarUserSettings = hooks.useValue;
export const useGetCalendarUserSettings = hooks.useGet;
