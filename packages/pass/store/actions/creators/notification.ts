import { createAction } from '@reduxjs/toolkit';

import { withCache } from '@proton/pass/store/actions/enhancers/cache';
import type { Notification } from '@proton/pass/store/actions/enhancers/notification';
import { getInAppNotificationsRequest, updateInAppNotificationStateRequest } from '@proton/pass/store/actions/requests';
import { requestActionsFactory } from '@proton/pass/store/request/flow';
import type { MaybeNull } from '@proton/pass/types';
import type { InAppNotifications, UpdateInAppNotificationDTO } from '@proton/pass/types/data/notification';
import { UNIX_HOUR } from '@proton/pass/utils/time/constants';

export const notification = createAction('notification', (notification: Notification) => ({
    meta: { notification },
    payload: {},
}));

export const getInAppNotifications = requestActionsFactory<void, MaybeNull<InAppNotifications>>(
    'in-app-notification::get'
)({
    requestId: getInAppNotificationsRequest,
    success: { config: { maxAge: UNIX_HOUR * 2 } },
});

export const updateInAppNotificationState = requestActionsFactory<
    UpdateInAppNotificationDTO,
    UpdateInAppNotificationDTO
>('in-app-notification::update-state')({
    requestId: updateInAppNotificationStateRequest,
    success: { prepare: (payload) => withCache({ payload }) },
});
