import { c } from 'ttag';

import { BadgeType } from '@proton/components/components/badge/Badge';
import { getIsCalendarDisabled, getIsCalendarProbablyActive } from '@proton/shared/lib/calendar/calendar';
import {
    getCalendarHasSubscriptionParameters,
    getCalendarIsNotSyncedInfo,
    getIsSubscribedCalendar,
} from '@proton/shared/lib/calendar/subscribe/helpers';
import { SubscribedCalendar, VisualCalendar } from '@proton/shared/lib/interfaces/calendar';

export enum CALENDAR_STATUS_TYPE {
    DEFAULT,
    ACTIVE,
    DISABLED,
    SYNCING,
    NOT_SYNCED,
}

export interface CalendarStatusBadge {
    statusType: CALENDAR_STATUS_TYPE;
    badgeType: BadgeType;
    text: string;
    tooltipText?: string;
}

export const getCalendarStatusBadges = (calendar: VisualCalendar | SubscribedCalendar, defaultCalendarID?: string) => {
    const isDisabled = getIsCalendarDisabled(calendar);
    const isActive = getIsCalendarProbablyActive(calendar);
    const isDefault = calendar.ID === defaultCalendarID;
    const isSubscribed = getIsSubscribedCalendar(calendar);
    const isNotSyncedInfo = getCalendarHasSubscriptionParameters(calendar)
        ? getCalendarIsNotSyncedInfo(calendar)
        : undefined;

    const badges: CalendarStatusBadge[] = [];

    if (isDefault) {
        badges.push({
            statusType: CALENDAR_STATUS_TYPE.DEFAULT,
            badgeType: 'primary',
            text: c('Calendar status').t`Default`,
        });
    }

    if (isActive) {
        badges.push({
            statusType: CALENDAR_STATUS_TYPE.ACTIVE,
            badgeType: 'success',
            text: c('Calendar status').t`Active`,
        });
    }

    if (isDisabled) {
        badges.push({
            statusType: CALENDAR_STATUS_TYPE.DISABLED,
            badgeType: 'light',
            text: c('Calendar status').t`Disabled`,
        });
    }

    if (isSubscribed && isNotSyncedInfo) {
        badges.push({
            statusType: CALENDAR_STATUS_TYPE.NOT_SYNCED,
            badgeType: 'warning',
            text: isNotSyncedInfo.label,
            tooltipText: isNotSyncedInfo.text,
        });
    }

    return { isDisabled, isActive, isDefault, isSubscribed, isNotSyncedInfo, badges };
};
