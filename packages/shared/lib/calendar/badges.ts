import { c } from 'ttag';

import type { BadgeType } from '@proton/components';

import type { SubscribedCalendar, VisualCalendar } from '../interfaces/calendar';
import { getIsCalendarDisabled, getIsCalendarProbablyActive, getIsSubscribedCalendar } from './calendar';
import { getCalendarHasSubscriptionParameters, getCalendarIsNotSyncedInfo } from './subscribe/helpers';

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
    className?: string;
}

export const getDefaultCalendarBadge = (): CalendarStatusBadge => ({
    statusType: CALENDAR_STATUS_TYPE.DEFAULT,
    badgeType: 'primary',
    text: c('Calendar status').t`Default`,
});

export const getActiveCalendarBadge = (): CalendarStatusBadge => ({
    statusType: CALENDAR_STATUS_TYPE.ACTIVE,
    badgeType: 'success',
    text: c('Calendar status').t`Active`,
});

export const getDisabledCalendarBadge = (): CalendarStatusBadge => ({
    statusType: CALENDAR_STATUS_TYPE.DISABLED,
    badgeType: 'light',
    text: c('Calendar status').t`Disabled`,
});

export const getNotSyncedCalendarBadge = ({
    text,
    tooltipText,
}: {
    text: string;
    tooltipText: string;
}): CalendarStatusBadge => ({
    statusType: CALENDAR_STATUS_TYPE.NOT_SYNCED,
    badgeType: 'warning',
    text,
    tooltipText,
});

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
        badges.push(getDefaultCalendarBadge());
    }

    if (isActive) {
        badges.push(getActiveCalendarBadge());
    }

    if (isDisabled) {
        badges.push(getDisabledCalendarBadge());
    }

    if (isSubscribed && isNotSyncedInfo) {
        badges.push(getNotSyncedCalendarBadge({ text: isNotSyncedInfo.label, tooltipText: isNotSyncedInfo.text }));
    }

    return { isDisabled, isActive, isDefault, isSubscribed, isNotSyncedInfo, badges };
};
