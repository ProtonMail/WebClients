import { createHooks } from '@proton/redux-utilities';

import { holidayCalendarsThunk, selectHolidayCalendars } from './index';

const hooks = createHooks(holidayCalendarsThunk, selectHolidayCalendars);

export const useHolidaysDirectory = hooks.useValue;
export const useGetHolidaysDirectory = hooks.useGet;
