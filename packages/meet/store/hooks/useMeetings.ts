import { createHooks } from '@proton/redux-utilities/hooks';

import { meetingsThunk, selectMeetings } from '../slices';

const hooks = createHooks(meetingsThunk, selectMeetings);

export const useMeetings = hooks.useValue;
export const useGetMeetings = hooks.useGet;
