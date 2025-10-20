import { createAction } from '@reduxjs/toolkit';

import { withCache } from '@proton/pass/store/actions/enhancers/cache';
import type { Notification } from '@proton/pass/store/actions/enhancers/notification';
import { requestActionsFactory } from '@proton/pass/store/request/flow';
import type { MaybeNull } from '@proton/pass/types';
import type { InAppNotifications, UpdateInAppNotificationDTO } from '@proton/pass/types/data/notification';
import { UNIX_HOUR } from '@proton/pass/utils/time/constants';

export const notification = createAction('notification', (notification: Notification) => ({
    meta: { notification },
    payload: {},
}));

export const getInAppNotifications = requestActionsFactory<void, MaybeNull<InAppNotifications>>('in-app-notification::get')({
    success: {
        prepare: (payload) => withCache({ payload }),
        config: { maxAge: UNIX_HOUR * 2, data: null },
    },
});

export const updateInAppNotificationState = requestActionsFactory<UpdateInAppNotificationDTO, UpdateInAppNotificationDTO>(
    'in-app-notification::update-state'
)({ success: { prepare: (payload) => withCache({ payload }) } });
