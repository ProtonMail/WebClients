import { createAction } from '@reduxjs/toolkit';

import type { ServerEvent } from '@proton/pass/types/api';

export const serverEvent = createAction('server event', (event: ServerEvent) => ({ payload: { event } }));
