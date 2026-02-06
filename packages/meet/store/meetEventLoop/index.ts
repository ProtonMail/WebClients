import { createAction } from '@reduxjs/toolkit';

import type { MeetEventResponse } from '@proton/shared/lib/interfaces/Meet';

export const meetEventLoop = createAction(
    'meet event loop v1',
    (payload: { event: MeetEventResponse; promises: Promise<any>[] }) => ({ payload })
);
