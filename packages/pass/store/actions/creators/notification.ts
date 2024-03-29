import { createAction } from '@reduxjs/toolkit';

import type { Notification } from '@proton/pass/store/actions/enhancers/notification';

export const notification = createAction('notification', (notification: Notification) => ({
    meta: { notification },
    payload: {},
}));
