import {
    MAX_CALENDARS_FREE,
    MAX_CALENDARS_PAID,
    MAX_SUBSCRIBED_CALENDARS,
} from '@proton/shared/lib/calendar/constants';
import getHasUserReachedCalendarLimit from '../../lib/calendar/getHasUserReachedCalendarLimit';

describe('getHasUserReachedCalendarLimit', () => {
    it('informs whether the calendar limit for a user and calendar type has been reached', () => {
        expect(
            getHasUserReachedCalendarLimit({
                calendarsLength: MAX_CALENDARS_FREE - 1,
                isFreeUser: true,
                isSubscribedCalendar: false,
            })
        ).toBe(false);

        expect(
            getHasUserReachedCalendarLimit({
                calendarsLength: MAX_CALENDARS_FREE,
                isFreeUser: true,
                isSubscribedCalendar: false,
            })
        ).toBe(true);

        expect(
            getHasUserReachedCalendarLimit({
                calendarsLength: MAX_CALENDARS_FREE + 1,
                isFreeUser: true,
                isSubscribedCalendar: false,
            })
        ).toBe(true);

        expect(
            getHasUserReachedCalendarLimit({
                calendarsLength: MAX_CALENDARS_PAID - 1,
                isFreeUser: false,
                isSubscribedCalendar: false,
            })
        ).toBe(false);

        expect(
            getHasUserReachedCalendarLimit({
                calendarsLength: MAX_CALENDARS_PAID,
                isFreeUser: false,
                isSubscribedCalendar: false,
            })
        ).toBe(true);

        expect(
            getHasUserReachedCalendarLimit({
                calendarsLength: MAX_CALENDARS_PAID + 1,
                isFreeUser: false,
                isSubscribedCalendar: false,
            })
        ).toBe(true);

        expect(
            getHasUserReachedCalendarLimit({
                calendarsLength: MAX_SUBSCRIBED_CALENDARS - 1,
                isFreeUser: true,
                isSubscribedCalendar: true,
            })
        ).toBe(false);

        expect(
            getHasUserReachedCalendarLimit({
                calendarsLength: MAX_SUBSCRIBED_CALENDARS - 1,
                isFreeUser: false,
                isSubscribedCalendar: true,
            })
        ).toBe(false);

        expect(
            getHasUserReachedCalendarLimit({
                calendarsLength: MAX_SUBSCRIBED_CALENDARS,
                isFreeUser: true,
                isSubscribedCalendar: true,
            })
        ).toBe(true);

        expect(
            getHasUserReachedCalendarLimit({
                calendarsLength: MAX_SUBSCRIBED_CALENDARS,
                isFreeUser: false,
                isSubscribedCalendar: true,
            })
        ).toBe(true);

        expect(
            getHasUserReachedCalendarLimit({
                calendarsLength: MAX_SUBSCRIBED_CALENDARS + 1,
                isFreeUser: true,
                isSubscribedCalendar: true,
            })
        ).toBe(true);

        expect(
            getHasUserReachedCalendarLimit({
                calendarsLength: MAX_SUBSCRIBED_CALENDARS + 1,
                isFreeUser: false,
                isSubscribedCalendar: true,
            })
        ).toBe(true);
    });
});
