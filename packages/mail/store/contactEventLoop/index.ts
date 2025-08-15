import { createAction } from '@reduxjs/toolkit';

import type { ContactEventV6Response } from '@proton/shared/lib/api/events';

export const contactEventLoopV6 = createAction(
    'contact event loop v6',
    (payload: { event: ContactEventV6Response; promises: Promise<any>[] }) => ({ payload })
);
