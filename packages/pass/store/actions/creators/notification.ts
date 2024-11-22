import { createAction } from '@reduxjs/toolkit';

import type { Notification } from '@proton/pass/store/actions/enhancers/notification';
import { getInAppNotificationsRequest } from '@proton/pass/store/actions/requests';
import { requestActionsFactory } from '@proton/pass/store/request/flow';
import type { MaybeNull } from '@proton/pass/types';
import type { UserInAppNotifications } from '@proton/pass/types/data/notification';
import { UNIX_HOUR } from '@proton/pass/utils/time/constants';

export const notification = createAction('notification', (notification: Notification) => ({
    meta: { notification },
    payload: {},
}));

export const getInAppNotifications = requestActionsFactory<void, MaybeNull<UserInAppNotifications>>(
    'in-app-notification::get'
)({
    requestId: getInAppNotificationsRequest,
    success: { config: { maxAge: UNIX_HOUR * 2 } },
});
