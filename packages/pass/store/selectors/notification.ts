import { createSelector } from '@reduxjs/toolkit';

import { isActiveNotification, isPromoNotification, isUnreadNotification } from '../../lib/notifications/notifications.utils';
import type { Maybe } from '../../types';
import type { InAppNotification } from '../../types/data/notification';
import { and, not } from '../../utils/fp/predicates';
import type { NotificationReducerState } from '../reducers/notification';
import type { State } from '../types';

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
