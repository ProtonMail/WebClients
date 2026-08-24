import unary from '@proton/utils/unary';

import type { Calendar, CalendarWithOwnMembers, VisualCalendar } from '../interfaces/calendar/Calendar';
import type { SubscribedCalendar } from '../interfaces/calendar/Subscription';
import { CALENDAR_TYPE } from './constants';

export const getIsPersonalCalendar = (calendar: VisualCalendar | SubscribedCalendar): calendar is VisualCalendar => {
    return calendar.Type === CALENDAR_TYPE.PERSONAL;
};

export const getIsOwnedCalendar = (calendar: CalendarWithOwnMembers) => {
    return calendar.Owner.Email === calendar.Members[0].Email;
};

export const getIsSubscribedCalendar = (
    calendar: Calendar | VisualCalendar | SubscribedCalendar
): calendar is SubscribedCalendar => {
    return calendar.Type === CALENDAR_TYPE.SUBSCRIPTION;
};

export const getIsHolidaysCalendar = (calendar: VisualCalendar) => {
    return calendar.Type === CALENDAR_TYPE.HOLIDAYS;
};

export const getIsUnknownCalendar = (calendar: VisualCalendar) => {
    const knownTypes = [CALENDAR_TYPE.PERSONAL, CALENDAR_TYPE.SUBSCRIPTION, CALENDAR_TYPE.HOLIDAYS];

    return !knownTypes.includes(calendar.Type);
};

export const getPersonalCalendars = <T extends Calendar>(calendars: T[] = []): T[] => {
    return calendars.filter(unary(getIsPersonalCalendar));
};

export const groupCalendarsByTaxonomy = (calendars: VisualCalendar[] = []) => {
    return calendars.reduce<{
        ownedPersonalCalendars: VisualCalendar[];
        sharedCalendars: VisualCalendar[];
        subscribedCalendars: VisualCalendar[];
        holidaysCalendars: VisualCalendar[];
        unknownCalendars: VisualCalendar[];
    }>(
        (acc, calendar) => {
            if (getIsSubscribedCalendar(calendar)) {
                acc.subscribedCalendars.push(calendar);
            } else if (getIsPersonalCalendar(calendar)) {
                const calendarsGroup = getIsOwnedCalendar(calendar) ? acc.ownedPersonalCalendars : acc.sharedCalendars;
                calendarsGroup.push(calendar);
            } else if (getIsHolidaysCalendar(calendar)) {
                acc.holidaysCalendars.push(calendar);
            } else {
                acc.unknownCalendars.push(calendar);
            }
            return acc;
        },
        {
            ownedPersonalCalendars: [],
            sharedCalendars: [],
            subscribedCalendars: [],
            holidaysCalendars: [],
            unknownCalendars: [],
        }
    );
};

export const getOwnedPersonalCalendars = (calendars: VisualCalendar[] = []) => {
    return groupCalendarsByTaxonomy(calendars).ownedPersonalCalendars;
};

export const getSharedCalendars = (calendars: VisualCalendar[] = []) => {
    return groupCalendarsByTaxonomy(calendars).sharedCalendars;
};

export const getSubscribedCalendars = (calendars: VisualCalendar[] = []) => {
    return groupCalendarsByTaxonomy(calendars).subscribedCalendars;
};
