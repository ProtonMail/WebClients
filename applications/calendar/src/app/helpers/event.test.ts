import { MAX_ATTENDEES } from '@proton/shared/lib/calendar/constants';
import { ADDRESS_SEND } from '@proton/shared/lib/constants';
import { addressBuilder } from '@proton/testing/lib/builders';

import {
    getCanChangeCalendarOfEvent,
    getCanDeleteEvent,
    getCanDuplicateEvent,
    getCanEditEvent,
    getCanEditSharedEventData,
    getCanReplyToEvent,
    getCannotSaveEvent,
    getIsAvailableCalendar,
} from './event';

describe('getCannotSaveEvent()', () => {
    test('Member cannot create invites in a shared calendar', () => {
        const isOwnedCalendar = false;
        const isOrganizer = true;
        const numberOfAttendees = MAX_ATTENDEES - 1;
        const canEditSharedEventData = true;

        expect(getCannotSaveEvent({ isOwnedCalendar, isOrganizer, numberOfAttendees, canEditSharedEventData })).toEqual(
            true
        );
    });

    test('Owner can create invites in a personal calendar', () => {
        const isOwnedCalendar = true;
        const isOrganizer = true;
        const numberOfAttendees = MAX_ATTENDEES - 1;
        const canEditSharedEventData = true;

        expect(getCannotSaveEvent({ isOwnedCalendar, isOrganizer, numberOfAttendees, canEditSharedEventData })).toEqual(
            false
        );
    });

    test('Owner cannot create invites with too many participants', () => {
        const isOwnedCalendar = true;
        const isOrganizer = true;
        const numberOfAttendees = MAX_ATTENDEES + 1;
        const canEditSharedEventData = true;

        expect(getCannotSaveEvent({ isOwnedCalendar, isOrganizer, numberOfAttendees, canEditSharedEventData })).toEqual(
            true
        );
    });

    test('Attendee can add notifications to invite in a personal calendar', () => {
        const isOwnedCalendar = true;
        const isOrganizer = false;
        const numberOfAttendees = MAX_ATTENDEES - 1;
        const canEditSharedEventData = false;

        expect(getCannotSaveEvent({ isOwnedCalendar, isOrganizer, numberOfAttendees, canEditSharedEventData })).toEqual(
            false
        );
    });

    test('Attendee can add notifications to invite in a shared calendar', () => {
        const isOwnedCalendar = false;
        const isOrganizer = false;
        const numberOfAttendees = MAX_ATTENDEES - 1;
        const canEditSharedEventData = false;

        expect(getCannotSaveEvent({ isOwnedCalendar, isOrganizer, numberOfAttendees, canEditSharedEventData })).toEqual(
            false
        );
    });

    test('Member can add notifications to an invite she organized in a shared calendar', () => {
        const isOwnedCalendar = false;
        const isOrganizer = true;
        const numberOfAttendees = 10;
        const canEditSharedEventData = false;

        expect(getCannotSaveEvent({ isOwnedCalendar, isOrganizer, numberOfAttendees, canEditSharedEventData })).toEqual(
            false
        );
    });
});

describe('getCanEditEvent()', () => {
    test('User can edit events in active calendars', () => {
        const combinations = [];
        for (let i = 0; i < 2 ** 1; i++) {
            const notificationsRevampAvailable = !!(1 & i);

            combinations.push({ notificationsRevampAvailable });
        }
        combinations.forEach(({ notificationsRevampAvailable }) => {
            expect(
                getCanEditEvent({
                    isCalendarDisabled: false,
                    isSubscribedCalendar: false,
                    notificationsRevampAvailable,
                })
            ).toEqual(true);
        });
    });

    test('User cannot edit events in disabled calendars', () => {
        const combinations = [];
        for (let i = 0; i < 2 ** 1; i++) {
            const notificationsRevampAvailable = !!(1 & i);

            combinations.push({ notificationsRevampAvailable });
        }
        combinations.forEach(({ notificationsRevampAvailable }) => {
            expect(
                getCanEditEvent({
                    isCalendarDisabled: true,
                    isSubscribedCalendar: false,
                    notificationsRevampAvailable,
                })
            ).toEqual(false);
        });
    });

    test('User can edit events in subscribed calendars if and only if notifications revamp is available', () => {
        const combinations = [];
        for (let i = 0; i < 2 ** 2; i++) {
            const isCalendarDisabled = !!(1 & i);
            const notificationsRevampAvailable = !!(2 & i);

            combinations.push({ isCalendarDisabled, notificationsRevampAvailable });
        }
        combinations.forEach(({ isCalendarDisabled, notificationsRevampAvailable }) => {
            expect(
                getCanEditEvent({
                    isCalendarDisabled,
                    isSubscribedCalendar: true,
                    notificationsRevampAvailable,
                })
            ).toEqual(notificationsRevampAvailable);
        });
    });
});

describe('getCanDeleteEvent()', () => {
    test('User cannot delete events in subscribed or other read-only calendars', () => {
        const combinations = [];
        for (let i = 0; i < 2 ** 2; i++) {
            const isOwnedCalendar = !!(1 & i);
            const isInvitation = !!(2 & i);

            combinations.push({ isOwnedCalendar, isInvitation });
        }
        combinations.forEach(({ isOwnedCalendar, isInvitation }) => {
            expect(
                getCanDeleteEvent({
                    isOwnedCalendar,
                    isCalendarWritable: false,
                    isInvitation,
                })
            ).toEqual(false);
        });
    });

    test('Attendee can delete invites in her own calendar', () => {
        const isOwnedCalendar = true;
        const isCalendarWritable = true;
        const isInvitation = true;

        expect(getCanDeleteEvent({ isOwnedCalendar, isCalendarWritable, isInvitation })).toEqual(true);
    });

    test('Member cannot delete invites in a shared calendar with edit rights', () => {
        const isOwnedCalendar = false;
        const isCalendarWritable = true;
        const isInvitation = true;

        expect(getCanDeleteEvent({ isOwnedCalendar, isCalendarWritable, isInvitation })).toEqual(false);
    });

    test('Member cannot delete invites in a shared calendar with view-only rights', () => {
        const isOwnedCalendar = false;
        const isCalendarWritable = false;
        const isInvitation = true;

        expect(getCanDeleteEvent({ isOwnedCalendar, isCalendarWritable, isInvitation })).toEqual(false);
    });
});

describe('getCanEditSharedEventData()', () => {
    const activeAddress = addressBuilder();
    const cannotSendAddress = {
        ...activeAddress,
        Send: ADDRESS_SEND.SEND_NO,
    };

    test('Owner can edit shared event data of events which are not invitations', () => {
        expect(
            getCanEditSharedEventData({
                isOwnedCalendar: true,
                isCalendarWritable: true,
                isOrganizer: false,
                isAttendee: false,
                isInvitation: false,
                selfAddress: undefined,
            })
        ).toEqual(true);
    });

    test('Owner can edit shared event data of events she organizes if the address is active', () => {
        expect(
            getCanEditSharedEventData({
                isOwnedCalendar: true,
                isCalendarWritable: true,
                isOrganizer: true,
                isAttendee: false,
                isInvitation: false,
                selfAddress: activeAddress,
            })
        ).toEqual(true);
    });

    test('Owner cannot edit shared event data of events she organizes if the address cannot send', () => {
        expect(
            getCanEditSharedEventData({
                isOwnedCalendar: true,
                isCalendarWritable: true,
                isOrganizer: true,
                isAttendee: false,
                isInvitation: true,
                selfAddress: cannotSendAddress,
            })
        ).toEqual(false);
    });

    test('User cannot edit shared event data in subscribed calendars', () => {
        const combinations = [];
        for (let i = 0; i < 2 ** 3; i++) {
            const isOrganizer = !!(1 & i);
            const isAttendee = !!(2 & i);
            const isInvitation = isOrganizer || isAttendee || !!(4 & i);
            const selfAddress = isOrganizer || isAttendee ? activeAddress : undefined;

            combinations.push({ isOrganizer, isAttendee, isInvitation, selfAddress });
        }
        combinations.forEach(({ isOrganizer, isAttendee, isInvitation, selfAddress }) => {
            expect(
                getCanEditSharedEventData({
                    isOwnedCalendar: true,
                    isCalendarWritable: false,
                    isOrganizer,
                    isAttendee,
                    isInvitation,
                    selfAddress,
                })
            ).toEqual(false);
        });
    });

    test('Member cannot edit shared event data in shared calendars with view-only rights', () => {
        const combinations = [];
        for (let i = 0; i < 2 ** 3; i++) {
            const isOrganizer = !!(1 & i);
            const isAttendee = !!(2 & i);
            const isInvitation = isOrganizer || isAttendee || !!(4 & i);
            const selfAddress = isOrganizer || isAttendee ? activeAddress : undefined;

            combinations.push({ isOrganizer, isAttendee, isInvitation, selfAddress });
        }
        combinations.forEach(({ isOrganizer, isAttendee, isInvitation, selfAddress }) => {
            expect(
                getCanEditSharedEventData({
                    isOwnedCalendar: false,
                    isCalendarWritable: false,
                    isOrganizer,
                    isAttendee,
                    isInvitation,
                    selfAddress,
                })
            ).toEqual(false);
        });
    });

    test('Member with edit rights cannot edit shared event data of invitations', () => {
        const combinations = [];
        for (let i = 0; i < 2 ** 2; i++) {
            const isOrganizer = !!(1 & i);
            const isAttendee = !!(2 & i);
            const selfAddress = isOrganizer || isAttendee ? activeAddress : undefined;

            combinations.push({ isOrganizer, isAttendee, selfAddress });
        }
        combinations.forEach(({ isOrganizer, isAttendee, selfAddress }) => {
            expect(
                getCanEditSharedEventData({
                    isOwnedCalendar: false,
                    isCalendarWritable: true,
                    isOrganizer,
                    isAttendee,
                    isInvitation: true,
                    selfAddress,
                })
            ).toEqual(false);
        });
    });

    test('Member with view-only rights cannot edit invitations', () => {
        const combinations = [];
        for (let i = 0; i < 2 ** 2; i++) {
            const isOrganizer = !!(1 & i);
            const isAttendee = !!(2 & i);
            const selfAddress = isOrganizer || isAttendee ? activeAddress : undefined;

            combinations.push({ isOrganizer, isAttendee, selfAddress });
        }
        combinations.forEach(({ isOrganizer, isAttendee, selfAddress }) => {
            expect(
                getCanEditSharedEventData({
                    isOwnedCalendar: false,
                    isCalendarWritable: false,
                    isOrganizer,
                    isAttendee,
                    isInvitation: true,
                    selfAddress,
                })
            ).toEqual(false);
        });
    });

    test('User cannot edit invitations in owned calendars if she is not organizing or attending', () => {
        expect(
            getCanEditSharedEventData({
                isOwnedCalendar: true,
                isCalendarWritable: true,
                isOrganizer: false,
                isAttendee: false,
                isInvitation: true,
                selfAddress: undefined,
            })
        ).toEqual(false);
    });
});

describe('getCanChangeCalendar()', () => {
    test('User can change calendar of events that are not invitations', () => {
        const combinations = [];
        for (let i = 0; i < 2 ** 2; i++) {
            const isOwnedCalendar = !!(1 & i);
            const isSingleEdit = !!(2 & i);

            combinations.push({ isOwnedCalendar, isSingleEdit });
        }
        combinations.forEach(({ isOwnedCalendar, isSingleEdit }) => {
            expect(
                getCanChangeCalendarOfEvent({
                    isCreateEvent: false,
                    isOwnedCalendar,
                    isCalendarWritable: true,
                    isSingleEdit,
                    isInvitation: false,
                    isAttendee: false,
                    isOrganizer: false,
                })
            ).toEqual(true);
        });
    });

    test('User creating event can change calendar', () => {
        const combinations = [];
        for (let i = 0; i < 2 ** 2; i++) {
            const isOwnedCalendar = !!(1 & i);
            const isOrganizer = !!(2 & i);
            const isInvitation = isOrganizer;

            combinations.push({ isOwnedCalendar, isOrganizer, isInvitation });
        }
        combinations.forEach(({ isOwnedCalendar, isInvitation, isOrganizer }) => {
            expect(
                getCanChangeCalendarOfEvent({
                    isCreateEvent: true,
                    isOwnedCalendar,
                    isCalendarWritable: true,
                    isSingleEdit: false,
                    isInvitation,
                    isAttendee: false,
                    isOrganizer,
                })
            ).toEqual(true);
        });
    });

    test('User cannot change calendar of event in non-writable calendar', () => {
        const combinations = [];
        for (let i = 0; i < 2 ** 5; i++) {
            const isOwnedCalendar = !!(1 & i);
            const isSingleEdit = !!(2 & i);
            const isOrganizer = !!(4 & i);
            const isAttendee = isOrganizer ? false : !!(8 & i);
            const isInvitation = isOrganizer || isAttendee ? true : !!(16 & i);

            combinations.push({ isOwnedCalendar, isSingleEdit, isInvitation, isOrganizer, isAttendee });
        }
        combinations.forEach(({ isOwnedCalendar, isSingleEdit, isInvitation, isOrganizer, isAttendee }) => {
            expect(
                getCanChangeCalendarOfEvent({
                    isCreateEvent: false,
                    isOwnedCalendar,
                    isCalendarWritable: false,
                    isSingleEdit,
                    isInvitation,
                    isAttendee,
                    isOrganizer,
                })
            ).toEqual(false);
        });
    });

    test('Member cannot change calendar of non-organized invitation in shared calendar', () => {
        const combinations = [];
        for (let i = 0; i < 2 ** 2; i++) {
            const isSingleEdit = !!(1 & i);
            const isAttendee = !!(2 & i);

            combinations.push({ isSingleEdit, isAttendee });
        }
        combinations.forEach(({ isSingleEdit, isAttendee }) => {
            expect(
                getCanChangeCalendarOfEvent({
                    isCreateEvent: false,
                    isOwnedCalendar: false,
                    isCalendarWritable: true,
                    isSingleEdit,
                    isInvitation: true,
                    isAttendee,
                    isOrganizer: false,
                })
            ).toEqual(false);
        });
    });

    test('Organizer cannot change calendar existing invitation', () => {
        const combinations = [];
        for (let i = 0; i < 2 ** 3; i++) {
            const isOwnedCalendar = !!(1 & i);
            const isCalendarWritable = !!(2 & i);
            const isSingleEdit = !!(4 & i);

            combinations.push({ isOwnedCalendar, isCalendarWritable, isSingleEdit });
        }
        combinations.forEach(({ isOwnedCalendar, isCalendarWritable, isSingleEdit }) => {
            expect(
                getCanChangeCalendarOfEvent({
                    isCreateEvent: false,
                    isOwnedCalendar,
                    isCalendarWritable,
                    isSingleEdit,
                    isInvitation: true,
                    isAttendee: false,
                    isOrganizer: true,
                })
            ).toEqual(false);
        });
    });

    test('Attendee can change calendar in owned calendars if the event is not a single edit', () => {
        expect(
            getCanChangeCalendarOfEvent({
                isCreateEvent: false,
                isOwnedCalendar: true,
                isCalendarWritable: true,
                isSingleEdit: false,
                isInvitation: true,
                isAttendee: true,
                isOrganizer: false,
            })
        ).toEqual(true);
        expect(
            getCanChangeCalendarOfEvent({
                isCreateEvent: false,
                isOwnedCalendar: true,
                isCalendarWritable: true,
                isSingleEdit: true,
                isInvitation: true,
                isAttendee: true,
                isOrganizer: false,
            })
        ).toEqual(false);
    });
});

describe('getIsAvailableCalendar()', () => {
    test('User cannot change calendar of events in subscribed or other read-only calendars', () => {
        const combinations = [];
        for (let i = 0; i < 2 ** 2; i++) {
            const isOwnedCalendar = !!(1 & i);
            const isInvitation = !!(2 & i);

            combinations.push({ isOwnedCalendar, isInvitation });
        }
        combinations.forEach(({ isOwnedCalendar, isInvitation }) => {
            expect(
                getIsAvailableCalendar({
                    isOwnedCalendar,
                    isCalendarWritable: false,
                    isInvitation,
                })
            ).toEqual(false);
        });
    });

    test('Invitations can only be changed to owned calendars', () => {
        const combinations = [];
        for (let i = 0; i < 2 ** 2; i++) {
            const isOwnedCalendar = !!(1 & i);
            const isCalendarWritable = isOwnedCalendar || !!(2 & i);

            combinations.push({ isOwnedCalendar, isCalendarWritable });
        }
        combinations.forEach(({ isOwnedCalendar, isCalendarWritable }) => {
            expect(
                getIsAvailableCalendar({
                    isOwnedCalendar,
                    isCalendarWritable,
                    isInvitation: true,
                })
            ).toEqual(isOwnedCalendar);
        });
    });

    test('Events that are not invitations can be changed to writable calendars', () => {
        const combinations = [];
        for (let i = 0; i < 2 ** 1; i++) {
            const isOwnedCalendar = !!(1 & i);
            const isCalendarWritable = isOwnedCalendar || !!(2 & i);

            combinations.push({ isOwnedCalendar, isCalendarWritable });
        }
        combinations.forEach(({ isOwnedCalendar, isCalendarWritable }) => {
            expect(
                getIsAvailableCalendar({
                    isOwnedCalendar,
                    isCalendarWritable,
                    isInvitation: true,
                })
            ).toEqual(isCalendarWritable);
        });
    });
});

describe('getCanDuplicateEvent()', () => {
    test('User cannot duplicate events in subscribed calendars', () => {
        const combinations = [];
        for (let i = 0; i < 2 ** 2; i++) {
            const isOrganizer = !!(1 & i);
            const isInvitation = isOrganizer || !!(2 & i);

            combinations.push({ isOrganizer, isInvitation });
        }
        combinations.forEach(({ isOrganizer, isInvitation }) => {
            expect(
                getCanDuplicateEvent({
                    isSubscribedCalendar: true,
                    isOwnedCalendar: true,
                    isInvitation,
                    isOrganizer,
                })
            ).toEqual(false);
        });
    });

    test('Owner can duplicate events that are not invitations', () => {
        expect(
            getCanDuplicateEvent({
                isSubscribedCalendar: false,
                isOwnedCalendar: true,
                isInvitation: false,
                isOrganizer: false,
            })
        ).toEqual(true);
    });

    test('Owner can duplicate invitations that she is organizing', () => {
        expect(
            getCanDuplicateEvent({
                isSubscribedCalendar: false,
                isOwnedCalendar: true,
                isInvitation: true,
                isOrganizer: true,
            })
        ).toEqual(true);
    });

    test('Owner cannot duplicate invitations if she is not the organizer', () => {
        expect(
            getCanDuplicateEvent({
                isSubscribedCalendar: false,
                isOwnedCalendar: true,
                isInvitation: true,
                isOrganizer: false,
            })
        ).toEqual(false);
    });

    test('Member can duplicate events that are not invitations', () => {
        expect(
            getCanDuplicateEvent({
                isSubscribedCalendar: false,
                isOwnedCalendar: false,
                isInvitation: false,
                isOrganizer: false,
            })
        ).toEqual(true);
    });

    test('Member cannot duplicate invitations', () => {
        const combinations = [];
        for (let i = 0; i < 2 ** 1; i++) {
            const isOrganizer = !!(1 & i);

            combinations.push({ isOrganizer });
        }
        combinations.forEach(({ isOrganizer }) => {
            expect(
                getCanDuplicateEvent({
                    isSubscribedCalendar: false,
                    isOwnedCalendar: false,
                    isInvitation: true,
                    isOrganizer,
                })
            ).toEqual(false);
        });
    });
});

describe('getCanReplyToEvent()', () => {
    test('User can reply to events he is invited in one of his own personal calendars if and only if the event is not cancelled', () => {
        const combinations = [];
        for (let i = 0; i < 2 ** 1; i++) {
            const isCancelled = !!(1 & i);

            combinations.push({ isCancelled });
        }
        combinations.forEach(({ isCancelled }) => {
            expect(
                getCanReplyToEvent({
                    isOwnedCalendar: true,
                    isCalendarWritable: true,
                    isAttendee: true,
                    isCancelled,
                })
            ).toEqual(!isCancelled);
        });
    });

    test('User cannot reply to events he is not attending', () => {
        const combinations = [];
        for (let i = 0; i < 2 ** 3; i++) {
            const isOwnedCalendar = !!(1 & i);
            const isCalendarWritable = isOwnedCalendar || !!(2 & i);
            const isCancelled = !!(4 & i);

            combinations.push({ isOwnedCalendar, isCalendarWritable, isCancelled });
        }
        combinations.forEach(({ isOwnedCalendar, isCalendarWritable, isCancelled }) => {
            expect(
                getCanReplyToEvent({
                    isOwnedCalendar,
                    isCalendarWritable,
                    isAttendee: false,
                    isCancelled,
                })
            ).toEqual(false);
        });
    });

    test('User cannot reply to invitations on subscribed calendars', () => {
        const combinations = [];
        for (let i = 0; i < 2 ** 1; i++) {
            const isCancelled = !!(1 & i);

            combinations.push({ isCancelled });
        }
        combinations.forEach(({ isCancelled }) => {
            expect(
                getCanReplyToEvent({
                    isOwnedCalendar: true,
                    isCalendarWritable: false,
                    isAttendee: true,
                    isCancelled,
                })
            ).toEqual(false);
        });
    });

    test('User cannot reply to invitations on shared calendars, with or without edit rights', () => {
        const combinations = [];
        for (let i = 0; i < 2 ** 2; i++) {
            const isCalendarWritable = !!(1 & i);
            const isCancelled = !!(2 & i);

            combinations.push({ isCalendarWritable, isCancelled });
        }
        combinations.forEach(({ isCalendarWritable, isCancelled }) => {
            expect(
                getCanReplyToEvent({
                    isOwnedCalendar: false,
                    isCalendarWritable,
                    isAttendee: true,
                    isCancelled,
                })
            ).toEqual(false);
        });
    });
});
