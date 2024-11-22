import type { Reducer } from 'redux';

import { getInAppNotifications } from '@proton/pass/store/actions';
import type { UserInAppNotifications } from '@proton/pass/types/data/notification';
import { partialMerge } from '@proton/pass/utils/object/merge';
import { getEpoch } from '@proton/pass/utils/time/epoch';

export type NotificationReducerState = UserInAppNotifications & {
    nextDisplayTime: number;
};

const getInitialState = (): NotificationReducerState => ({
    notifications: [],
    total: 0,
    lastId: null,
    nextDisplayTime: getEpoch(),
});

const reducer: Reducer<NotificationReducerState> = (state = getInitialState(), action) => {
    if (getInAppNotifications.success.match(action)) {
        const userNotification = action.payload;

        if (!userNotification) return state;

        return partialMerge(state, userNotification);
    }

    // TODO: When dismissing/reading the notification, update the nextDisplayTime + 30 mins
    // "nextDisplayTime" manages the display timing for notifications on the client side.
    // If there are two or more notifications, we should enforce a 30-minute interval between displays.
    //return partialMerge(state, { ...userNotification, nextDisplayTime: state.nextDisplayTime ?? getEpoch() + UNIX_MINUTE * 30 });

    return state;
};

export default reducer;
