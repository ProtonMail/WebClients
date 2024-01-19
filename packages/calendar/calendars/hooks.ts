import { createHooks } from '@proton/redux-utilities';

import { calendarsThunk, selectCalendars } from './index';

const hooks = createHooks(calendarsThunk, selectCalendars);

export const useCalendars = hooks.useValue;
export const useGetCalendars = hooks.useGet;
