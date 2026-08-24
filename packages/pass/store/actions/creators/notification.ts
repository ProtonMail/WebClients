import { createAction } from '@reduxjs/toolkit';

import type { MaybeNull } from '../../../types';
import type { InAppNotifications, UpdateInAppNotificationDTO } from '../../../types/data/notification';
import { UNIX_HOUR } from '../../../utils/time/constants';
import { cachedRequest } from '../../request/configs';
import { requestActionsFactory } from '../../request/flow';
import { withCache } from '../enhancers/cache';
import type { Notification } from '../enhancers/notification';

export const notification = createAction('notification', (notification: Notification) => ({
    meta: { notification },
    payload: {},
}));

export const getInAppNotifications = requestActionsFactory<void, MaybeNull<InAppNotifications>>('in-app-notification::get')({
    success: { ...cachedRequest(UNIX_HOUR * 2), prepare: (payload) => withCache({ payload }) },
});

export const updateInAppNotificationState = requestActionsFactory<UpdateInAppNotificationDTO, UpdateInAppNotificationDTO>(
    'in-app-notification::update-state'
)({ success: { prepare: (payload) => withCache({ payload }) } });
