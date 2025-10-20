import { InAppNotificationDisplayType, InAppNotificationState } from '@proton/pass/types';
import type { InAppNotification } from '@proton/pass/types/data/notification';

export const isPromoNotification = (notification: InAppNotification) =>
    notification.content.displayType === InAppNotificationDisplayType.PROMO;

export const isUnreadNotification = (notification: InAppNotification) =>
    notification.state === InAppNotificationState.UNREAD;

export const isActiveNotification = (now: number) => (notification: InAppNotification) =>
    notification.state !== InAppNotificationState.DISMISSED &&
    now > notification.startTime &&
    (!notification.endTime || now < notification.endTime);
