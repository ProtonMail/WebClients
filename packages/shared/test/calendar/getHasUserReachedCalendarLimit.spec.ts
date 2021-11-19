import getHasUserReachedCalendarLimit from '../../lib/calendar/getHasUserReachedCalendarLimit';
import {
    MAX_CALENDARS_PER_FREE_USER,
    MAX_CALENDARS_PER_USER,
    MAX_SUBSCRIBED_CALENDARS_PER_USER,
} from '../../lib/calendar/constants';

describe('getHasUserReachedCalendarLimit', () => {
    it('informs whether the calendar limit for a user and calendar type has been reached', () => {
        expect(
            getHasUserReachedCalendarLimit({
                calendarsLength: MAX_CALENDARS_PER_FREE_USER - 1,
                isFreeUser: true,
                isSubscribedCalendar: false,
            })
        ).toBe(false);

        expect(
            getHasUserReachedCalendarLimit({
                calendarsLength: MAX_CALENDARS_PER_FREE_USER,
                isFreeUser: true,
                isSubscribedCalendar: false,
            })
        ).toBe(true);

        expect(
            getHasUserReachedCalendarLimit({
                calendarsLength: MAX_CALENDARS_PER_FREE_USER + 1,
                isFreeUser: true,
                isSubscribedCalendar: false,
            })
        ).toBe(true);

        expect(
            getHasUserReachedCalendarLimit({
                calendarsLength: MAX_CALENDARS_PER_USER - 1,
                isFreeUser: false,
                isSubscribedCalendar: false,
            })
        ).toBe(false);

        expect(
            getHasUserReachedCalendarLimit({
                calendarsLength: MAX_CALENDARS_PER_USER,
                isFreeUser: false,
                isSubscribedCalendar: false,
            })
        ).toBe(true);

        expect(
            getHasUserReachedCalendarLimit({
                calendarsLength: MAX_CALENDARS_PER_USER + 1,
                isFreeUser: false,
                isSubscribedCalendar: false,
            })
        ).toBe(true);

        expect(
            getHasUserReachedCalendarLimit({
                calendarsLength: MAX_SUBSCRIBED_CALENDARS_PER_USER - 1,
                isFreeUser: true,
                isSubscribedCalendar: true,
            })
        ).toBe(false);

        expect(
            getHasUserReachedCalendarLimit({
                calendarsLength: MAX_SUBSCRIBED_CALENDARS_PER_USER - 1,
                isFreeUser: false,
                isSubscribedCalendar: true,
            })
        ).toBe(false);

        expect(
            getHasUserReachedCalendarLimit({
                calendarsLength: MAX_SUBSCRIBED_CALENDARS_PER_USER,
                isFreeUser: true,
                isSubscribedCalendar: true,
            })
        ).toBe(true);

        expect(
            getHasUserReachedCalendarLimit({
                calendarsLength: MAX_SUBSCRIBED_CALENDARS_PER_USER,
                isFreeUser: false,
                isSubscribedCalendar: true,
            })
        ).toBe(true);

        expect(
            getHasUserReachedCalendarLimit({
                calendarsLength: MAX_SUBSCRIBED_CALENDARS_PER_USER + 1,
                isFreeUser: true,
                isSubscribedCalendar: true,
            })
        ).toBe(true);

        expect(
            getHasUserReachedCalendarLimit({
                calendarsLength: MAX_SUBSCRIBED_CALENDARS_PER_USER + 1,
                isFreeUser: false,
                isSubscribedCalendar: true,
            })
        ).toBe(true);
    });
});
