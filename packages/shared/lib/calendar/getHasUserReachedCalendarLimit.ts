import { MAX_CALENDARS_PER_FREE_USER, MAX_CALENDARS_PER_USER, MAX_SUBSCRIBED_CALENDARS_PER_USER } from './constants';

const getHasUserReachedCalendarLimit = ({
    calendarsLength,
    isFreeUser,
    isSubscribedCalendar,
}: {
    calendarsLength: number;
    isFreeUser: boolean;
    isSubscribedCalendar: boolean;
}) =>
    isSubscribedCalendar
        ? calendarsLength === MAX_SUBSCRIBED_CALENDARS_PER_USER
        : isFreeUser
        ? calendarsLength === MAX_CALENDARS_PER_FREE_USER
        : calendarsLength === MAX_CALENDARS_PER_USER;

export default getHasUserReachedCalendarLimit;
