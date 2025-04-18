import type { Reducer } from 'redux';

import { getInAppNotifications, updateInAppNotificationState } from '@proton/pass/store/actions';
import type { InAppNotifications } from '@proton/pass/types/data/notification';
import { partialMerge } from '@proton/pass/utils/object/merge';
import { UNIX_MINUTE } from '@proton/pass/utils/time/constants';
import { getEpoch } from '@proton/pass/utils/time/epoch';

export type NotificationReducerState = InAppNotifications & { nextDisplayTime: number };

const getInitialState = (): NotificationReducerState => ({
    notifications: [],
    total: 0,
    lastId: null,
    nextDisplayTime: getEpoch(),
});

const reducer: Reducer<NotificationReducerState> = (state = getInitialState(), action) => {
    if (getInAppNotifications.success.match(action)) {
        if (!action.payload) return state;

        // remove upgrade notifications on safari extension
        const notifications =
            BUILD_TARGET === 'safari'
                ? {
                      ...action.payload,
                      notifications: action.payload.notifications.filter(({ content }) => {
                          if (content.cta?.type === 'external_link') return false;
                          if (content.cta?.ref?.includes('internal/upgrade')) return false;
                          return true;
                      }),
                  }
                : action.payload;

        return partialMerge(state, notifications);
    }

    if (updateInAppNotificationState.intent.match(action)) {
        const { id, state: notificationState } = action.payload;

        const notifications = state.notifications.map((notification) =>
            notification.id === id ? { ...notification, state: notificationState } : notification
        );

        /** "nextDisplayTime" manages the display timing for notifications
         * on the client side. If there are two or more notifications, we
         * should enforce a 30-minute interval between displays. */
        return partialMerge(state, { notifications, nextDisplayTime: getEpoch() + UNIX_MINUTE * 30 });
    }

    return state;
};

export default reducer;
