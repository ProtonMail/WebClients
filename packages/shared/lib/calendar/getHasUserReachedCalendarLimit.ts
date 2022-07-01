import {
    MAX_CALENDARS_FREE,
    MAX_CALENDARS_PAID,
    MAX_SUBSCRIBED_CALENDARS,
} from '@proton/shared/lib/calendar/constants';

const getHasUserReachedCalendarLimit = ({
    calendarsLength,
    isFreeUser,
    isSubscribedCalendar,
}: {
    calendarsLength: number;
    isFreeUser: boolean;
    isSubscribedCalendar: boolean;
}) => {
    if (isSubscribedCalendar) {
        return calendarsLength >= MAX_SUBSCRIBED_CALENDARS;
    }

    if (isFreeUser) {
        return calendarsLength >= MAX_CALENDARS_FREE;
    }

    return calendarsLength >= MAX_CALENDARS_PAID;
};

export default getHasUserReachedCalendarLimit;
