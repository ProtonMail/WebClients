import { createAction } from '@reduxjs/toolkit';

import type { CoreEventV6Response } from '@proton/shared/lib/api/events';

export const coreEventLoopV6 = createAction(
    'core event loop v6',
    (payload: { event: CoreEventV6Response; promises: Promise<unknown>[] }) => ({ payload })
);
