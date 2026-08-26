import { createHooks } from '@proton/redux-utilities/hooks';

import { scheduleCallThunk, selectScheduleCall } from './index';

const hooks = createHooks(scheduleCallThunk, selectScheduleCall);

export const useGetScheduleCall = hooks.useGet;
