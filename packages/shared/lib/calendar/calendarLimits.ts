import { c } from 'ttag';

import { BRAND_NAME, MAIL_SHORT_APP_NAME } from '../constants';
import { VisualCalendar } from '../interfaces/calendar';
import { getOwnedPersonalCalendars } from './calendar';
import { MAX_CALENDARS_FREE, MAX_CALENDARS_PAID } from './constants';

export const getHasUserReachedCalendarsLimit = (calendars: VisualCalendar[], isFreeUser: boolean) => {
    const ownedPersonalCalendars = getOwnedPersonalCalendars(calendars);
    const maxPersonalCalendars = isFreeUser ? MAX_CALENDARS_FREE : MAX_CALENDARS_PAID;

    // we enforce users to have at least one owned personal calendar
    const isCalendarsLimitReached = calendars.length >= maxPersonalCalendars && ownedPersonalCalendars.length > 0;

    return {
        isCalendarsLimitReached,
        isOtherCalendarsLimitReached:
            isCalendarsLimitReached || calendars.length - ownedPersonalCalendars.length >= maxPersonalCalendars - 1,
    };
};

export const getCalendarsLimitReachedText = (isFreeUser: boolean) => {
    const maxReachedText = c('Limit of calendars reached')
        .t`You've reached the maximum number of calendars available in your plan.`;
    const addNewCalendarText = isFreeUser
        ? c('Limit of calendars reached')
              .t`To add a new calendar, remove another calendar or upgrade your ${BRAND_NAME} plan to a ${MAIL_SHORT_APP_NAME} paid plan.`
        : c('Limit of calendars reached').t`To add a new calendar, remove an existing one.`;

    return {
        maxReachedText,
        addNewCalendarText,
        combinedText: `${maxReachedText} ${addNewCalendarText}`,
    };
};

export const willUserReachCalendarsLimit = (
    calendars: VisualCalendar[],
    calendarsToCreateCount: number,
    isFreeUser: boolean
) => {
    const maxCalendars = isFreeUser ? MAX_CALENDARS_FREE : MAX_CALENDARS_PAID;
    const isCalendarsLimitReached = calendars.length + calendarsToCreateCount > maxCalendars;

    return isCalendarsLimitReached;
};
