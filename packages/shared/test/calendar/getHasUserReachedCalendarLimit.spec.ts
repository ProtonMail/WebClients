import {
    CALENDAR_FLAGS,
    MAX_CALENDARS_FREE,
    MAX_CALENDARS_PAID,
    MAX_SUBSCRIBED_CALENDARS,
} from '@proton/shared/lib/calendar/constants';
import { MEMBER_PERMISSIONS } from '@proton/shared/lib/calendar/permissions';
import { CALENDAR_DISPLAY, CALENDAR_TYPE } from '@proton/shared/lib/interfaces/calendar';

import getHasUserReachedCalendarsLimit from '../../lib/calendar/getHasUserReachedCalendarsLimit';

const generateSimpleCalendar = (
    i: number,
    {
        calendarEmail = 'calendarEmail',
        ownerEmail = 'calendarEmail',
        permissions = MEMBER_PERMISSIONS.OWNS,
        type = CALENDAR_TYPE.PERSONAL,
        flags = CALENDAR_FLAGS.ACTIVE,
        display = CALENDAR_DISPLAY.VISIBLE,
        color = '#F00',
    }: {
        calendarEmail?: string;
        ownerEmail?: string;
        permissions?: number;
        type?: CALENDAR_TYPE;
        flags?: CALENDAR_FLAGS;
        display?: CALENDAR_DISPLAY;
        color?: string;
    }
) => ({
    ID: `id-${i}`,
    Name: `name-${i}`,
    Description: `description-${i}`,
    Type: type,
    Flags: flags,
    Email: calendarEmail,
    Color: color,
    Display: display,
    Permissions: permissions,
    Owner: { Email: ownerEmail },
    Members: [
        {
            ID: `member-${i}`,
            Email: calendarEmail,
            Permissions: permissions,
            AddressID: `address-id-${i}`,
            Flags: flags,
            Color: color,
            Display: display,
            CalendarID: `id-${i}`,
            Name: `name-${i}`,
            Description: `description-${i}`,
        },
    ],
});

const generateOwnedPersonalCalendars = (n: number) => {
    return Array(n)
        .fill(1)
        .map((val, i) => generateSimpleCalendar(i, {}));
};

const generateSharedCalendars = (n: number) => {
    if (n <= 0) {
        return [];
    }
    return Array(n)
        .fill(1)
        .map((val, i) => generateSimpleCalendar(i, { calendarEmail: 'calendarEmail', ownerEmail: 'ownerEmail' }));
};

const generateSubscribedCalendars = (n: number) => {
    return Array(n)
        .fill(1)
        .map((val, i) => generateSimpleCalendar(i, { type: CALENDAR_TYPE.SUBSCRIPTION }));
};

describe('getHasUserReachedCalendarLimit', () => {
    describe('informs whether the calendar limits for a free user have been reached', () => {
        [
            // owned calendars
            {
                calendars: generateOwnedPersonalCalendars(MAX_CALENDARS_FREE - 1),
                isFreeUser: true,
                result: {
                    isPersonalCalendarsLimitReached: false,
                    isSharedCalendarsLimitReached: true,
                    isSubscribedCalendarsLimitReached: false,
                },
            },
            {
                calendars: generateOwnedPersonalCalendars(MAX_CALENDARS_FREE),
                isFreeUser: true,
                result: {
                    isPersonalCalendarsLimitReached: true,
                    isSharedCalendarsLimitReached: true,
                    isSubscribedCalendarsLimitReached: false,
                },
            },
            {
                calendars: generateOwnedPersonalCalendars(MAX_CALENDARS_FREE + 1),
                isFreeUser: true,
                result: {
                    isPersonalCalendarsLimitReached: true,
                    isSharedCalendarsLimitReached: true,
                    isSubscribedCalendarsLimitReached: false,
                },
            },
            // shared calendars
            {
                calendars: generateSharedCalendars(MAX_CALENDARS_FREE - 1),
                isFreeUser: true,
                result: {
                    isPersonalCalendarsLimitReached: false,
                    isSharedCalendarsLimitReached: true,
                    isSubscribedCalendarsLimitReached: false,
                },
            },
            {
                calendars: generateSharedCalendars(MAX_CALENDARS_FREE),
                isFreeUser: true,
                result: {
                    isPersonalCalendarsLimitReached: true,
                    isSharedCalendarsLimitReached: true,
                    isSubscribedCalendarsLimitReached: false,
                },
            },
            // subscribed calendars
            {
                calendars: generateSubscribedCalendars(MAX_SUBSCRIBED_CALENDARS - 1),
                isFreeUser: true,
                result: {
                    isPersonalCalendarsLimitReached: false,
                    isSharedCalendarsLimitReached: true,
                    isSubscribedCalendarsLimitReached: false,
                },
            },
            {
                calendars: generateSubscribedCalendars(MAX_SUBSCRIBED_CALENDARS),
                isFreeUser: true,
                result: {
                    isPersonalCalendarsLimitReached: false,
                    isSharedCalendarsLimitReached: true,
                    isSubscribedCalendarsLimitReached: true,
                },
            },
            {
                calendars: generateSubscribedCalendars(MAX_SUBSCRIBED_CALENDARS + 1),
                isFreeUser: true,
                result: {
                    isPersonalCalendarsLimitReached: false,
                    isSharedCalendarsLimitReached: true,
                    isSubscribedCalendarsLimitReached: true,
                },
            },
        ].forEach(({ calendars, isFreeUser, result }, i) => {
            it(`is limit reached for case ${i + 1}`, () => {
                expect(getHasUserReachedCalendarsLimit({ calendars, isFreeUser })).toEqual(result);
            });
        });
    });

    describe('informs whether the calendar limits for a paid user have been reached', () => {
        [
            // owned calendars
            {
                calendars: generateOwnedPersonalCalendars(MAX_CALENDARS_PAID - 1),
                isFreeUser: false,
                result: {
                    isPersonalCalendarsLimitReached: false,
                    isSharedCalendarsLimitReached: false,
                    isSubscribedCalendarsLimitReached: false,
                },
            },
            {
                calendars: generateOwnedPersonalCalendars(MAX_CALENDARS_PAID),
                isFreeUser: false,
                result: {
                    isPersonalCalendarsLimitReached: true,
                    isSharedCalendarsLimitReached: false,
                    isSubscribedCalendarsLimitReached: false,
                },
            },
            {
                calendars: generateOwnedPersonalCalendars(MAX_CALENDARS_PAID + 1),
                isFreeUser: false,
                result: {
                    isPersonalCalendarsLimitReached: true,
                    isSharedCalendarsLimitReached: false,
                    isSubscribedCalendarsLimitReached: false,
                },
            },
            // shared calendars
            {
                calendars: generateSharedCalendars(MAX_CALENDARS_PAID - 1),
                isFreeUser: false,
                result: {
                    isPersonalCalendarsLimitReached: false,
                    isSharedCalendarsLimitReached: true,
                    isSubscribedCalendarsLimitReached: false,
                },
            },
            {
                calendars: [...generateOwnedPersonalCalendars(1), ...generateSharedCalendars(MAX_CALENDARS_PAID - 1)],
                isFreeUser: false,
                result: {
                    isPersonalCalendarsLimitReached: true,
                    isSharedCalendarsLimitReached: true,
                    isSubscribedCalendarsLimitReached: false,
                },
            },
            {
                calendars: [...generateOwnedPersonalCalendars(2), ...generateSharedCalendars(MAX_CALENDARS_PAID - 2)],
                isFreeUser: false,
                result: {
                    isPersonalCalendarsLimitReached: true,
                    isSharedCalendarsLimitReached: false,
                    isSubscribedCalendarsLimitReached: false,
                },
            },
            {
                calendars: generateSharedCalendars(MAX_CALENDARS_PAID),
                isFreeUser: false,
                result: {
                    isPersonalCalendarsLimitReached: true,
                    isSharedCalendarsLimitReached: true,
                    isSubscribedCalendarsLimitReached: false,
                },
            },
            {
                calendars: generateSharedCalendars(MAX_CALENDARS_PAID + 1),
                isFreeUser: false,
                result: {
                    isPersonalCalendarsLimitReached: true,
                    isSharedCalendarsLimitReached: true,
                    isSubscribedCalendarsLimitReached: false,
                },
            },
            {
                calendars: [...generateOwnedPersonalCalendars(1), ...generateSharedCalendars(MAX_CALENDARS_PAID)],
                isFreeUser: false,
                result: {
                    isPersonalCalendarsLimitReached: true,
                    isSharedCalendarsLimitReached: true,
                    isSubscribedCalendarsLimitReached: false,
                },
            },
            // subscribed calendars
            {
                calendars: generateSubscribedCalendars(MAX_SUBSCRIBED_CALENDARS - 1),
                isFreeUser: false,
                result: {
                    isPersonalCalendarsLimitReached: false,
                    isSharedCalendarsLimitReached: false,
                    isSubscribedCalendarsLimitReached: false,
                },
            },
            {
                calendars: generateSubscribedCalendars(MAX_SUBSCRIBED_CALENDARS),
                isFreeUser: false,
                result: {
                    isPersonalCalendarsLimitReached: false,
                    isSharedCalendarsLimitReached: false,
                    isSubscribedCalendarsLimitReached: true,
                },
            },
            {
                calendars: generateSubscribedCalendars(MAX_SUBSCRIBED_CALENDARS + 1),
                isFreeUser: false,
                result: {
                    isPersonalCalendarsLimitReached: false,
                    isSharedCalendarsLimitReached: false,
                    isSubscribedCalendarsLimitReached: true,
                },
            },
            // all
            {
                calendars: [
                    ...generateOwnedPersonalCalendars(17),
                    ...generateSharedCalendars(2),
                    ...generateSubscribedCalendars(5),
                ],
                isFreeUser: false,
                result: {
                    isPersonalCalendarsLimitReached: false,
                    isSharedCalendarsLimitReached: false,
                    isSubscribedCalendarsLimitReached: true,
                },
            },
        ].forEach(({ calendars, isFreeUser, result }, i) => {
            it(`is limit reached for case ${i + 1}`, () => {
                expect(getHasUserReachedCalendarsLimit({ calendars, isFreeUser })).toEqual(result);
            });
        });
    });
});
