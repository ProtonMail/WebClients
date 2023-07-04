import { sortCalendars } from '@proton/shared/lib/calendar/calendar';
import { CALENDAR_TYPE } from '@proton/shared/lib/calendar/constants';
import { VisualCalendar } from '@proton/shared/lib/interfaces/calendar';

describe('sortCalendars', () => {
    const holidaysCalendar = {
        Type: CALENDAR_TYPE.HOLIDAYS,
        Priority: 1,
        Members: [{ Email: 'teestpm1@pm.me', Priority: 1 }],
    } as VisualCalendar;
    const subscribedCalendar = {
        Type: CALENDAR_TYPE.SUBSCRIPTION,
        Owner: { Email: 'otherpmowner@pm.me' },
        Priority: 1,
        Members: [{ Email: 'teestpm1@pm.me', Priority: 1 }],
    } as VisualCalendar;
    const sharedCalendar = {
        Type: CALENDAR_TYPE.PERSONAL,
        Owner: { Email: 'otherpmowner@pm.me' },
        Priority: 1,
        Members: [{ Email: 'teestpm1@pm.me', Priority: 1 }],
    } as VisualCalendar;
    const sharedCalendarB = {
        Type: CALENDAR_TYPE.PERSONAL,
        Owner: { Email: 'otherpmowner@pm.me' },
        Priority: 2,
        Members: [{ Email: 'teestpm1@pm.me', Priority: 2 }],
    } as VisualCalendar;
    const ownedCalendar = {
        Type: CALENDAR_TYPE.PERSONAL,
        Owner: { Email: 'teestpm1@pm.me' },
        Priority: 1,
        Members: [{ Email: 'teestpm1@pm.me', Priority: 1 }],
    } as VisualCalendar;
    const ownedCalendarB = {
        Type: CALENDAR_TYPE.PERSONAL,
        Owner: { Email: 'teestpm1@pm.me' },
        Priority: 2,
        Members: [{ Email: 'teestpm1@pm.me', Priority: 2 }],
    } as VisualCalendar;

    it('should return calendars sorted by weight', () => {
        expect(sortCalendars([holidaysCalendar, subscribedCalendar, sharedCalendar, ownedCalendar])).toEqual([
            ownedCalendar,
            subscribedCalendar,
            sharedCalendar,
            holidaysCalendar,
        ]);
    });

    describe('when some calendars have same weight', () => {
        it('should sort them by priority', () => {
            expect(
                sortCalendars([
                    holidaysCalendar,
                    sharedCalendarB,
                    subscribedCalendar,
                    ownedCalendarB,
                    sharedCalendar,
                    ownedCalendar,
                ])
            ).toEqual([
                ownedCalendar,
                ownedCalendarB,
                subscribedCalendar,
                sharedCalendar,
                sharedCalendarB,
                holidaysCalendar,
            ]);
        });
    });
});
