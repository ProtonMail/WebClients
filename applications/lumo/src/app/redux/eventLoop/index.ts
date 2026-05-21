import { createAction } from '@reduxjs/toolkit';

import type { LumoEventResponse } from '@proton/shared/lib/interfaces/Lumo';

export const lumoEventLoop = createAction(
    'lumo event loop',
    (payload: { event: LumoEventResponse; promises: Promise<any>[] }) => ({ payload })
);
