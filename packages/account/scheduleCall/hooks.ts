import { createHooks } from '@proton/redux-utilities';

import { scheduleCallThunk, selectScheduleCall } from './index';

const hooks = createHooks(scheduleCallThunk, selectScheduleCall);

export const useScheduleCall = hooks.useValue;
export const useGetScheduleCall = hooks.useGet;
