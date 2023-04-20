import { createAction } from '@reduxjs/toolkit';

import withCacheBlock from '../with-cache-block';
import { Notification } from '../with-notification';

export const notification = createAction('notification', (notification: Notification) =>
    withCacheBlock({
        meta: { notification },
        payload: {},
    })
);
