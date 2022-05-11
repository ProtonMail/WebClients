import { groupCalendarsByTaxonomy } from '@proton/shared/lib/calendar/calendar';
import {
    MAX_CALENDARS_FREE,
    MAX_CALENDARS_PAID,
    MAX_SUBSCRIBED_CALENDARS,
} from '@proton/shared/lib/calendar/constants';
import { VisualCalendar } from '@proton/shared/lib/interfaces/calendar';

const getHasUserReachedCalendarsLimit = ({
    calendars,
    isFreeUser,
}: {
    calendars: VisualCalendar[];
    isFreeUser: boolean;
}) => {
    const { ownedPersonalCalendars, sharedCalendars, subscribedCalendars } = groupCalendarsByTaxonomy(calendars);
    const maxPersonalCalendars = isFreeUser ? MAX_CALENDARS_FREE : MAX_CALENDARS_PAID;

    // we enforce users to have at least one owned personal calendar
    return {
        isPersonalCalendarsLimitReached: ownedPersonalCalendars.length + sharedCalendars.length >= maxPersonalCalendars,
        isSharedCalendarsLimitReached: sharedCalendars.length >= maxPersonalCalendars - 1,
        isSubscribedCalendarsLimitReached: subscribedCalendars.length >= MAX_SUBSCRIBED_CALENDARS,
    };
};

export default getHasUserReachedCalendarsLimit;
