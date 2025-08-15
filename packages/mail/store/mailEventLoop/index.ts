import { createAction } from '@reduxjs/toolkit';

import type { MailEventV6Response } from '@proton/shared/lib/api/events';

export const mailEventLoopV6 = createAction(
    'mail event loop v6',
    (payload: { event: MailEventV6Response; promises: Promise<any>[] }) => ({ payload })
);
