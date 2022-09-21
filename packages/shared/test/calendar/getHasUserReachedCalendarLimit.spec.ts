import {
    MAX_CALENDARS_FREE,
    MAX_CALENDARS_PAID,
    MAX_SUBSCRIBED_CALENDARS,
} from '@proton/shared/lib/calendar/constants';
import {
    generateOwnedPersonalCalendars,
    generateSharedCalendars,
    generateSubscribedCalendars,
} from '@proton/testing/lib/builders';

import getHasUserReachedCalendarsLimit from '../../lib/calendar/getHasUserReachedCalendarsLimit';

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
