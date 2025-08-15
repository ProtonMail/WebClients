import { createAction } from '@reduxjs/toolkit';

import type { CalendarEventV6Response } from '@proton/shared/lib/api/events';

export const calendarEventLoopV6 = createAction(
    'calendar event loop v6',
    (payload: { event: CalendarEventV6Response; promises: Promise<any>[] }) => ({ payload })
);
