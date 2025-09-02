import { createSelector } from '@reduxjs/toolkit';

import type { NotificationReducerState } from '@proton/pass/store/reducers/notification';
import type { State } from '@proton/pass/store/types';
import { InAppNotificationState, type Maybe } from '@proton/pass/types';
import type { InAppNotification } from '@proton/pass/types/data/notification';

export const selectNotificationState = ({ notification }: State): NotificationReducerState => notification;

export const selectNextNotification = (timeFrom: number) =>
    createSelector([selectNotificationState], ({ notifications, nextDisplayTime }): Maybe<InAppNotification> => {
        if (nextDisplayTime > timeFrom) return;

        // timeFrom should be greater than startTime and less than endTime (if defined)
        return notifications.find(
            ({ startTime, endTime, state }) =>
                state === InAppNotificationState.UNREAD && timeFrom > startTime && (!endTime || timeFrom < endTime)
        );
    });
