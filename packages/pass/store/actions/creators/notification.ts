import { createAction } from '@reduxjs/toolkit';

import withCacheBlock from '@proton/pass/store/actions/with-cache-block';
import type { Notification } from '@proton/pass/store/actions/with-notification';

export const notification = createAction('notification', (notification: Notification) =>
    withCacheBlock({ meta: { notification }, payload: {} })
);
