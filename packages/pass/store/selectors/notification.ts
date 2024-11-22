import { createSelector } from '@reduxjs/toolkit';

import type { NotificationReducerState } from '@proton/pass/store/reducers/notification';
import type { State } from '@proton/pass/store/types';
import type { Maybe } from '@proton/pass/types';
import { type InAppNotification, NotificationState } from '@proton/pass/types/data/notification';
import { getEpoch } from '@proton/pass/utils/time/epoch';

export const selectNotificationState = ({ notification }: State): NotificationReducerState => notification;

export const selectNextNotification = createSelector(
    [selectNotificationState],
    ({ notifications, nextDisplayTime }): Maybe<InAppNotification> => {
        const now = getEpoch();

        if (nextDisplayTime > now) return;

        // Date should be greater than startTime and less than endTime (if defined)
        return notifications.find(
            ({ startTime, endTime, state }) =>
                state === NotificationState.UNREAD && now > startTime && (!endTime || now < endTime)
        );
    }
);
