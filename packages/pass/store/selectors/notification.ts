import { createSelector } from '@reduxjs/toolkit';

import { isActiveNotification, isPromoNotification, isUnreadNotification } from '@proton/pass/lib/notifications/notifications.utils';
import type { NotificationReducerState } from '@proton/pass/store/reducers/notification';
import type { State } from '@proton/pass/store/types';
import type { Maybe } from '@proton/pass/types';
import type { InAppNotification } from '@proton/pass/types/data/notification';
import { and, not } from '@proton/pass/utils/fp/predicates';

export const selectNotificationState = ({ notification }: State): NotificationReducerState => notification;
export const selectNotificationNextDisplayTime = ({ notification }: State) => notification.nextDisplayTime;

/** `now` should be greater than startTime and less than endTime (if defined)
 * for a notification to be considered as active */
export const matchActiveNotification =
    (match: (notification: InAppNotification) => boolean) =>
    (now: number, throttle: boolean = true) =>
        createSelector(selectNotificationState, ({ notifications, nextDisplayTime }): Maybe<InAppNotification> => {
            if (throttle && nextDisplayTime > now) return;
            return notifications.find(and(match, isActiveNotification(now)));
        });

export const selectActiveNotification = matchActiveNotification(and(isUnreadNotification, not(isPromoNotification)));
export const selectActivePromoNotification = matchActiveNotification(isPromoNotification);
