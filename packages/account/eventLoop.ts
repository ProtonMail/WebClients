import { createAction } from '@reduxjs/toolkit';

import type { EventLoop } from '@proton/redux-shared-store-types/eventLoop';

export const serverEvent = createAction('server event', (payload: EventLoop) => ({ payload }));
