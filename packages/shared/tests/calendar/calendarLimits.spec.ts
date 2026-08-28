import {
    generateOwnedPersonalCalendars,
    generateSharedCalendars,
    generateSubscribedCalendars,
} from '@proton/testing/lib/builders';

import { getHasUserReachedCalendarsLimit, willUserReachCalendarsLimit } from '../../lib/calendar/calendarLimits';
import { MAX_CALENDARS_FREE, MAX_CALENDARS_PAID } from '../../lib/calendar/constants';

describe('getHasUserReachedCalendarLimit()', () => {
    describe('informs whether the calendar limits for a free user have been reached', () => {
        [
            // owned calendars
            {
                calendars: generateOwnedPersonalCalendars(MAX_CALENDARS_FREE - 1),
                isFreeUser: true,
                result: {
                    isCalendarsLimitReached: false,
                    isOtherCalendarsLimitReached: false,
                },
            },
            {
                calendars: generateOwnedPersonalCalendars(MAX_CALENDARS_FREE),
                isFreeUser: true,
                result: {
                    isCalendarsLimitReached: true,
                    isOtherCalendarsLimitReached: true,
                },
            },
            {
                calendars: generateOwnedPersonalCalendars(MAX_CALENDARS_FREE + 1),
                isFreeUser: true,
                result: {
                    isCalendarsLimitReached: true,
                    isOtherCalendarsLimitReached: true,
                },
            },
            // shared calendars
            {
                calendars: generateSharedCalendars(MAX_CALENDARS_FREE - 1),
                isFreeUser: true,
                result: {
                    isCalendarsLimitReached: false,
                    isOtherCalendarsLimitReached: true,
                },
            },
            {
                calendars: generateSharedCalendars(MAX_CALENDARS_FREE),
                isFreeUser: true,
                result: {
                    isCalendarsLimitReached: false,
                    isOtherCalendarsLimitReached: true,
                },
            },
            {
                calendars: generateSharedCalendars(MAX_CALENDARS_FREE + 1),
                isFreeUser: true,
                result: {
                    isCalendarsLimitReached: false,
                    isOtherCalendarsLimitReached: true,
                },
            },
            // subscribed calendars
            {
                calendars: generateSubscribedCalendars(MAX_CALENDARS_FREE - 1),
                isFreeUser: true,
                result: {
                    isCalendarsLimitReached: false,
                    isOtherCalendarsLimitReached: true,
                },
            },
            {
                calendars: generateSubscribedCalendars(MAX_CALENDARS_FREE),
                isFreeUser: true,
                result: {
                    isCalendarsLimitReached: false,
                    isOtherCalendarsLimitReached: true,
                },
            },
            {
                calendars: generateSubscribedCalendars(MAX_CALENDARS_FREE + 1),
                isFreeUser: true,
                result: {
                    isCalendarsLimitReached: false,
                    isOtherCalendarsLimitReached: true,
                },
            },
            // shared and owned personal
            {
                calendars: [...generateOwnedPersonalCalendars(1), ...generateSharedCalendars(MAX_CALENDARS_FREE - 1)],
                isFreeUser: true,
                result: {
                    isCalendarsLimitReached: true,
                    isOtherCalendarsLimitReached: true,
                },
            },
            {
                calendars: [...generateOwnedPersonalCalendars(2), ...generateSharedCalendars(MAX_CALENDARS_FREE - 2)],
                isFreeUser: true,
                result: {
                    isCalendarsLimitReached: true,
                    isOtherCalendarsLimitReached: true,
                },
            },
            {
                calendars: [...generateOwnedPersonalCalendars(1), ...generateSharedCalendars(MAX_CALENDARS_FREE)],
                isFreeUser: true,
                result: {
                    isCalendarsLimitReached: true,
                    isOtherCalendarsLimitReached: true,
                },
            },
            // subscribed and owned personal
            {
                calendars: [
                    ...generateOwnedPersonalCalendars(1),
                    ...generateSubscribedCalendars(MAX_CALENDARS_FREE - 1),
                ],
                isFreeUser: true,
                result: {
                    isCalendarsLimitReached: true,
                    isOtherCalendarsLimitReached: true,
                },
            },
            {
                calendars: [
                    ...generateOwnedPersonalCalendars(2),
                    ...generateSubscribedCalendars(MAX_CALENDARS_FREE - 2),
                ],
                isFreeUser: true,
                result: {
                    isCalendarsLimitReached: true,
                    isOtherCalendarsLimitReached: true,
                },
            },
            {
                calendars: [...generateOwnedPersonalCalendars(1), ...generateSubscribedCalendars(MAX_CALENDARS_FREE)],
                isFreeUser: true,
                result: {
                    isCalendarsLimitReached: true,
                    isOtherCalendarsLimitReached: true,
                },
            },
            // subscribed and shared
            {
                calendars: [...generateSharedCalendars(1), ...generateSubscribedCalendars(1)],
                isFreeUser: true,
                result: {
                    isCalendarsLimitReached: false,
                    isOtherCalendarsLimitReached: true,
                },
            },
            {
                calendars: [...generateSharedCalendars(1), ...generateSubscribedCalendars(MAX_CALENDARS_FREE - 2)],
                isFreeUser: true,
                result: {
                    isCalendarsLimitReached: false,
                    isOtherCalendarsLimitReached: true,
                },
            },
            {
                calendars: [...generateSharedCalendars(MAX_CALENDARS_FREE - 2), ...generateSubscribedCalendars(1)],
                isFreeUser: true,
                result: {
                    isCalendarsLimitReached: false,
                    isOtherCalendarsLimitReached: true,
                },
            },
            {
                calendars: [...generateSubscribedCalendars(2), ...generateSharedCalendars(MAX_CALENDARS_FREE - 2)],
                isFreeUser: true,
                result: {
                    isCalendarsLimitReached: false,
                    isOtherCalendarsLimitReached: true,
                },
            },
            {
                calendars: [...generateSharedCalendars(1), ...generateSubscribedCalendars(MAX_CALENDARS_FREE)],
                isFreeUser: true,
                result: {
                    isCalendarsLimitReached: false,
                    isOtherCalendarsLimitReached: true,
                },
            },
            // all
            {
                calendars: [
                    ...generateOwnedPersonalCalendars(1),
                    ...generateSharedCalendars(1),
                    ...generateSubscribedCalendars(1),
                ],
                isFreeUser: true,
                result: {
                    isCalendarsLimitReached: true,
                    isOtherCalendarsLimitReached: true,
                },
            },
            {
                calendars: [
                    ...generateOwnedPersonalCalendars(1),
                    ...generateSharedCalendars(2),
                    ...generateSubscribedCalendars(3),
                ],
                isFreeUser: true,
                result: {
                    isCalendarsLimitReached: true,
                    isOtherCalendarsLimitReached: true,
                },
            },
        ].forEach(({ calendars, isFreeUser, result }, i) => {
            it(`is limit reached for case ${i + 1}`, () => {
                expect(getHasUserReachedCalendarsLimit(calendars, isFreeUser)).toEqual(result);
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
                    isCalendarsLimitReached: false,
                    isOtherCalendarsLimitReached: false,
                },
            },
            {
                calendars: generateOwnedPersonalCalendars(MAX_CALENDARS_PAID),
                isFreeUser: false,
                result: {
                    isCalendarsLimitReached: true,
                    isOtherCalendarsLimitReached: true,
                },
            },
            {
                calendars: generateOwnedPersonalCalendars(MAX_CALENDARS_PAID + 1),
                isFreeUser: false,
                result: {
                    isCalendarsLimitReached: true,
                    isOtherCalendarsLimitReached: true,
                },
            },
            // shared calendars
            {
                calendars: generateSharedCalendars(MAX_CALENDARS_PAID - 1),
                isFreeUser: false,
                result: {
                    isCalendarsLimitReached: false,
                    isOtherCalendarsLimitReached: true,
                },
            },
            {
                calendars: generateSharedCalendars(MAX_CALENDARS_PAID),
                isFreeUser: false,
                result: {
                    isCalendarsLimitReached: false,
                    isOtherCalendarsLimitReached: true,
                },
            },
            {
                calendars: generateSharedCalendars(MAX_CALENDARS_PAID + 1),
                isFreeUser: false,
                result: {
                    isCalendarsLimitReached: false,
                    isOtherCalendarsLimitReached: true,
                },
            },
            // subscribed calendars
            {
                calendars: generateSubscribedCalendars(MAX_CALENDARS_PAID - 1),
                isFreeUser: false,
                result: {
                    isCalendarsLimitReached: false,
                    isOtherCalendarsLimitReached: true,
                },
            },
            {
                calendars: generateSubscribedCalendars(MAX_CALENDARS_PAID),
                isFreeUser: false,
                result: {
                    isCalendarsLimitReached: false,
                    isOtherCalendarsLimitReached: true,
                },
            },
            {
                calendars: generateSubscribedCalendars(MAX_CALENDARS_PAID + 1),
                isFreeUser: false,
                result: {
                    isCalendarsLimitReached: false,
                    isOtherCalendarsLimitReached: true,
                },
            },
            // shared and owned personal
            {
                calendars: [...generateOwnedPersonalCalendars(1), ...generateSharedCalendars(MAX_CALENDARS_PAID - 1)],
                isFreeUser: false,
                result: {
                    isCalendarsLimitReached: true,
                    isOtherCalendarsLimitReached: true,
                },
            },
            {
                calendars: [...generateOwnedPersonalCalendars(2), ...generateSharedCalendars(MAX_CALENDARS_PAID - 2)],
                isFreeUser: false,
                result: {
                    isCalendarsLimitReached: true,
                    isOtherCalendarsLimitReached: true,
                },
            },
            {
                calendars: [...generateOwnedPersonalCalendars(1), ...generateSharedCalendars(MAX_CALENDARS_PAID)],
                isFreeUser: false,
                result: {
                    isCalendarsLimitReached: true,
                    isOtherCalendarsLimitReached: true,
                },
            },
            // subscribed and owned personal
            {
                calendars: [
                    ...generateOwnedPersonalCalendars(1),
                    ...generateSubscribedCalendars(MAX_CALENDARS_PAID - 1),
                ],
                isFreeUser: false,
                result: {
                    isCalendarsLimitReached: true,
                    isOtherCalendarsLimitReached: true,
                },
            },
            {
                calendars: [
                    ...generateOwnedPersonalCalendars(2),
                    ...generateSubscribedCalendars(MAX_CALENDARS_PAID - 2),
                ],
                isFreeUser: false,
                result: {
                    isCalendarsLimitReached: true,
                    isOtherCalendarsLimitReached: true,
                },
            },
            {
                calendars: [...generateOwnedPersonalCalendars(1), ...generateSubscribedCalendars(MAX_CALENDARS_PAID)],
                isFreeUser: false,
                result: {
                    isCalendarsLimitReached: true,
                    isOtherCalendarsLimitReached: true,
                },
            },
            // subscribed and shared
            {
                calendars: [...generateSharedCalendars(1), ...generateSubscribedCalendars(MAX_CALENDARS_PAID - 3)],
                isFreeUser: false,
                result: {
                    isCalendarsLimitReached: false,
                    isOtherCalendarsLimitReached: false,
                },
            },
            {
                calendars: [...generateSharedCalendars(MAX_CALENDARS_PAID - 3), ...generateSubscribedCalendars(1)],
                isFreeUser: false,
                result: {
                    isCalendarsLimitReached: false,
                    isOtherCalendarsLimitReached: false,
                },
            },
            {
                calendars: [...generateSharedCalendars(1), ...generateSubscribedCalendars(MAX_CALENDARS_PAID - 2)],
                isFreeUser: false,
                result: {
                    isCalendarsLimitReached: false,
                    isOtherCalendarsLimitReached: true,
                },
            },
            {
                calendars: [...generateSharedCalendars(MAX_CALENDARS_PAID - 2), ...generateSubscribedCalendars(1)],
                isFreeUser: false,
                result: {
                    isCalendarsLimitReached: false,
                    isOtherCalendarsLimitReached: true,
                },
            },
            {
                calendars: [...generateSubscribedCalendars(2), ...generateSharedCalendars(MAX_CALENDARS_PAID - 2)],
                isFreeUser: false,
                result: {
                    isCalendarsLimitReached: false,
                    isOtherCalendarsLimitReached: true,
                },
            },
            {
                calendars: [...generateSharedCalendars(1), ...generateSubscribedCalendars(MAX_CALENDARS_PAID)],
                isFreeUser: false,
                result: {
                    isCalendarsLimitReached: false,
                    isOtherCalendarsLimitReached: true,
                },
            },
            // all
            {
                calendars: [
                    ...generateOwnedPersonalCalendars(MAX_CALENDARS_PAID - 5),
                    ...generateSharedCalendars(2),
                    ...generateSubscribedCalendars(2),
                ],
                isFreeUser: false,
                result: {
                    isCalendarsLimitReached: false,
                    isOtherCalendarsLimitReached: false,
                },
            },
            {
                calendars: [
                    ...generateOwnedPersonalCalendars(MAX_CALENDARS_PAID - 5),
                    ...generateSharedCalendars(2),
                    ...generateSubscribedCalendars(3),
                ],
                isFreeUser: false,
                result: {
                    isCalendarsLimitReached: true,
                    isOtherCalendarsLimitReached: true,
                },
            },
            {
                calendars: [...generateSharedCalendars(MAX_CALENDARS_PAID - 3), ...generateSubscribedCalendars(2)],
                isFreeUser: false,
                result: {
                    isCalendarsLimitReached: false,
                    isOtherCalendarsLimitReached: true,
                },
            },
        ].forEach(({ calendars, isFreeUser, result }, i) => {
            it(`is limit reached for case ${i + 1}`, () => {
                expect(getHasUserReachedCalendarsLimit(calendars, isFreeUser)).toEqual(result);
            });
        });
    });
});

describe('willUserReachCalendarsLimit()', () => {
    describe('informs whether the calendar limits for a free user will be reached from easy switch', () => {
        [
            // owned calendars
            {
                number: 1,
                calendars: generateOwnedPersonalCalendars(MAX_CALENDARS_FREE - 2),
                isFreeUser: true,
                result: false,
            },
            {
                number: 1,
                calendars: generateOwnedPersonalCalendars(MAX_CALENDARS_FREE),
                isFreeUser: true,
                result: true,
            },
            {
                number: 1,
                calendars: generateOwnedPersonalCalendars(MAX_CALENDARS_FREE + 1),
                isFreeUser: true,
                result: true,
            },

            {
                number: 1,
                calendars: generateSharedCalendars(MAX_CALENDARS_FREE - 1),
                isFreeUser: true,
                result: false,
            },
            {
                number: 1,
                calendars: generateSharedCalendars(MAX_CALENDARS_FREE),
                isFreeUser: true,
                result: true,
            },
            {
                number: 1,
                calendars: generateSharedCalendars(MAX_CALENDARS_FREE + 1),
                isFreeUser: true,
                result: true,
            },
            // subscribed calendars
            {
                number: 1,
                calendars: generateSubscribedCalendars(MAX_CALENDARS_FREE - 1),
                isFreeUser: true,
                result: false,
            },
            {
                number: 1,
                calendars: generateSubscribedCalendars(MAX_CALENDARS_FREE),
                isFreeUser: true,
                result: true,
            },
            {
                number: 1,
                calendars: generateSubscribedCalendars(MAX_CALENDARS_FREE + 1),
                isFreeUser: true,
                result: true,
            },
            // shared and owned personal
            {
                number: 1,
                calendars: [...generateOwnedPersonalCalendars(1), ...generateSharedCalendars(MAX_CALENDARS_FREE - 1)],
                isFreeUser: true,
                result: true,
            },
            {
                number: 1,
                calendars: [...generateOwnedPersonalCalendars(2), ...generateSharedCalendars(MAX_CALENDARS_FREE - 2)],
                isFreeUser: true,
                result: true,
            },
            {
                number: 1,
                calendars: [...generateOwnedPersonalCalendars(1), ...generateSharedCalendars(MAX_CALENDARS_FREE)],
                isFreeUser: true,
                result: true,
            },
            // subscribed and owned personal
            {
                number: 1,
                calendars: [
                    ...generateOwnedPersonalCalendars(1),
                    ...generateSubscribedCalendars(MAX_CALENDARS_FREE - 1),
                ],
                isFreeUser: true,
                result: true,
            },
            {
                number: 1,
                calendars: [
                    ...generateOwnedPersonalCalendars(2),
                    ...generateSubscribedCalendars(MAX_CALENDARS_FREE - 2),
                ],
                isFreeUser: true,
                result: true,
            },
            {
                number: 1,
                calendars: [...generateOwnedPersonalCalendars(1), ...generateSubscribedCalendars(MAX_CALENDARS_FREE)],
                isFreeUser: true,
                result: true,
            },
            // subscribed and shared
            {
                number: 1,
                calendars: [...generateSharedCalendars(1), ...generateSubscribedCalendars(1)],
                isFreeUser: true,
                result: false,
            },
            {
                number: 1,
                calendars: [...generateSharedCalendars(1), ...generateSubscribedCalendars(MAX_CALENDARS_FREE - 2)],
                isFreeUser: true,
                result: false,
            },
            {
                number: 1,
                calendars: [...generateSharedCalendars(MAX_CALENDARS_FREE - 2), ...generateSubscribedCalendars(1)],
                isFreeUser: true,
                result: false,
            },
            {
                number: 1,
                calendars: [...generateSubscribedCalendars(2), ...generateSharedCalendars(MAX_CALENDARS_FREE - 2)],
                isFreeUser: true,
                result: true,
            },
            {
                number: 1,
                calendars: [...generateSharedCalendars(1), ...generateSubscribedCalendars(MAX_CALENDARS_FREE)],
                isFreeUser: true,
                result: true,
            },
            // all
            {
                number: 1,
                calendars: [
                    ...generateOwnedPersonalCalendars(1),
                    ...generateSharedCalendars(1),
                    ...generateSubscribedCalendars(1),
                ],
                isFreeUser: true,
                result: true,
            },
            {
                number: 1,
                calendars: [
                    ...generateOwnedPersonalCalendars(1),
                    ...generateSharedCalendars(2),
                    ...generateSubscribedCalendars(3),
                ],
                isFreeUser: true,
                result: true,
            },
        ].forEach(({ calendars, number, isFreeUser, result }, i) => {
            it(`is limit reached for case ${i + 1}`, () => {
                expect(willUserReachCalendarsLimit(calendars, number, isFreeUser)).toEqual(result);
            });
        });
    });

    describe('informs whether the calendar limits for a paid user was reach from easy switch', () => {
        [
            // owned calendars
            {
                number: 1,
                calendars: generateOwnedPersonalCalendars(MAX_CALENDARS_PAID - 2),
                isFreeUser: false,
                result: false,
            },
            {
                number: 1,
                calendars: generateOwnedPersonalCalendars(MAX_CALENDARS_PAID),
                isFreeUser: false,
                result: true,
            },
            {
                number: 1,
                calendars: generateOwnedPersonalCalendars(MAX_CALENDARS_PAID + 1),
                isFreeUser: false,
                result: true,
            },
            // shared calendars
            {
                number: 1,
                calendars: generateSharedCalendars(MAX_CALENDARS_PAID - 1),
                isFreeUser: false,
                result: false,
            },
            {
                number: 1,
                calendars: generateSharedCalendars(MAX_CALENDARS_PAID),
                isFreeUser: false,
                result: true,
            },
            {
                number: 1,
                calendars: generateSharedCalendars(MAX_CALENDARS_PAID + 1),
                isFreeUser: false,
                result: true,
            },
            // subscribed calendars
            {
                number: 1,
                calendars: generateSubscribedCalendars(MAX_CALENDARS_PAID - 1),
                isFreeUser: false,
                result: false,
            },
            {
                number: 1,
                calendars: generateSubscribedCalendars(MAX_CALENDARS_PAID),
                isFreeUser: false,
                result: true,
            },
            {
                number: 1,
                calendars: generateSubscribedCalendars(MAX_CALENDARS_PAID + 1),
                isFreeUser: false,
                result: true,
            },
            // shared and owned personal
            {
                number: 1,
                calendars: [...generateOwnedPersonalCalendars(1), ...generateSharedCalendars(MAX_CALENDARS_PAID - 1)],
                isFreeUser: false,
                result: true,
            },
            {
                number: 1,
                calendars: [...generateOwnedPersonalCalendars(2), ...generateSharedCalendars(MAX_CALENDARS_PAID - 2)],
                isFreeUser: false,
                result: true,
            },
            {
                number: 1,
                calendars: [...generateOwnedPersonalCalendars(1), ...generateSharedCalendars(MAX_CALENDARS_PAID)],
                isFreeUser: false,
                result: true,
            },
            // subscribed and owned personal
            {
                calendars: [
                    ...generateOwnedPersonalCalendars(1),
                    ...generateSubscribedCalendars(MAX_CALENDARS_PAID - 1),
                ],
                number: 1,
                isFreeUser: false,
                result: true,
            },
            {
                calendars: [
                    ...generateOwnedPersonalCalendars(2),
                    ...generateSubscribedCalendars(MAX_CALENDARS_PAID - 2),
                ],
                number: 1,
                isFreeUser: false,
                result: true,
            },
            {
                number: 1,
                calendars: [...generateOwnedPersonalCalendars(1), ...generateSubscribedCalendars(MAX_CALENDARS_PAID)],
                isFreeUser: false,
                result: true,
            },
            // subscribed and shared
            {
                number: 1,
                calendars: [...generateSharedCalendars(1), ...generateSubscribedCalendars(MAX_CALENDARS_PAID - 3)],
                isFreeUser: false,
                result: false,
            },
            {
                number: 1,
                calendars: [...generateSharedCalendars(MAX_CALENDARS_PAID - 3), ...generateSubscribedCalendars(1)],
                isFreeUser: false,
                result: false,
            },
            {
                number: 1,
                calendars: [...generateSharedCalendars(1), ...generateSubscribedCalendars(MAX_CALENDARS_PAID - 2)],
                isFreeUser: false,
                result: false,
            },
            {
                number: 1,
                calendars: [...generateSharedCalendars(MAX_CALENDARS_PAID - 2), ...generateSubscribedCalendars(1)],
                isFreeUser: false,
                result: false,
            },
            {
                number: 1,
                calendars: [...generateSubscribedCalendars(2), ...generateSharedCalendars(MAX_CALENDARS_PAID - 2)],
                isFreeUser: false,
                result: true,
            },
            {
                number: 1,
                calendars: [...generateSharedCalendars(1), ...generateSubscribedCalendars(MAX_CALENDARS_PAID)],
                isFreeUser: false,
                result: true,
            },
            // all
            {
                calendars: [
                    ...generateOwnedPersonalCalendars(MAX_CALENDARS_PAID - 6),
                    ...generateSharedCalendars(2),
                    ...generateSubscribedCalendars(2),
                ],
                number: 1,
                isFreeUser: false,
                result: false,
            },
            {
                calendars: [
                    ...generateOwnedPersonalCalendars(MAX_CALENDARS_PAID - 5),
                    ...generateSharedCalendars(2),
                    ...generateSubscribedCalendars(3),
                ],
                number: 1,
                isFreeUser: false,
                result: true,
            },
            {
                number: 1,
                calendars: [...generateSharedCalendars(MAX_CALENDARS_PAID - 3), ...generateSubscribedCalendars(2)],
                isFreeUser: false,
                result: false,
            },
        ].forEach(({ calendars, number, isFreeUser, result }, i) => {
            it(`is limit reached for case ${i + 1}`, () => {
                expect(willUserReachCalendarsLimit(calendars, number, isFreeUser)).toEqual(result);
            });
        });
    });
});
