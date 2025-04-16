import { getUnixTime } from 'date-fns';

import { ATTENDEE_MORE_ATTENDEES, ATTENDEE_STATUS_API } from '@proton/shared/lib/calendar/constants';
import type {
    CalendarEvent,
    CalendarEventBlobData,
    CalendarEventSharedData,
} from '@proton/shared/lib/interfaces/calendar';

import { getHasUpdatedAttendees, getHasUpdatedEventData } from './upsertCalendarEventStoreRecord';

// dummy test data
const dummyModifyTime = getUnixTime(Date.UTC(2023, 9, 24));
const dummyAttendee = {
    ID: 'attendee-1',
    Token: 'token-1',
    Status: ATTENDEE_STATUS_API.NEEDS_ACTION,
    UpdateTime: dummyModifyTime,
    Comment: null,
};
const dummySharedData: CalendarEventSharedData = {
    ID: 'id',
    SharedEventID: 'shared-event-id',
    CalendarID: 'calendar-id',
    CreateTime: 0,
    ModifyTime: dummyModifyTime,
    Permissions: 0,
    IsOrganizer: 0,
    IsProtonProtonInvite: 0,
    IsPersonalSingleEdit: false,
    Author: 'author',
    Color: null,
};
const dummyBlobData: CalendarEventBlobData = {
    CalendarKeyPacket: null,
    CalendarEvents: [],
    SharedKeyPacket: 'shared-key-packet',
    AddressKeyPacket: null,
    AddressID: 'address-id',
    SharedEvents: [],
    Notifications: null,
    AttendeesEvents: [],
    AttendeesInfo: {
        Attendees: [dummyAttendee],
        MoreAttendees: ATTENDEE_MORE_ATTENDEES.NO,
    },
};
const dummyEventData: CalendarEvent = {
    ...dummySharedData,
    ...dummyBlobData,
    StartTime: getUnixTime(Date.UTC(2023, 9, 31)),
    StartTimezone: 'Europe/Warsaw',
    EndTime: getUnixTime(Date.UTC(2023, 10, 1)),
    EndTimezone: 'Europe/Warsaw',
    FullDay: 1,
    RRule: null,
    UID: 'uid',
    RecurrenceID: null,
    Exdates: [],
};

describe('getHasUpdatedAttendees', function () {
    it('does not update attendees when the new event does not have blob data', () => {
        const newEventData = { ...dummySharedData };

        // no old event data
        expect(getHasUpdatedAttendees(newEventData)).toEqual({ hasUpdatedAttendees: false });
        // old event data has only shared data
        expect(
            getHasUpdatedAttendees(newEventData, {
                ...dummySharedData,
                ModifyTime: dummyModifyTime - 1,
            })
        ).toEqual({ hasUpdatedAttendees: false });
        expect(
            getHasUpdatedAttendees(newEventData, {
                ...dummySharedData,
                ModifyTime: dummyModifyTime + 1,
            })
        ).toEqual({ hasUpdatedAttendees: false });
        // old event data is full
        expect(
            getHasUpdatedAttendees(newEventData, {
                ...dummyEventData,
            })
        ).toEqual({ hasUpdatedAttendees: false });
    });

    it('does not update attendees when attendees nor attendee times have not changed', () => {
        const newEventData = {
            ...dummyEventData,
            Attendees: [
                {
                    ...dummyAttendee,
                    // status changed
                    Status: ATTENDEE_STATUS_API.ACCEPTED,
                },
            ],
        };

        const oldEventData = {
            ...dummyEventData,
        };
        expect(getHasUpdatedAttendees(newEventData, oldEventData)).toEqual({
            hasUpdatedAttendees: false,
            attendees: oldEventData.AttendeesInfo.Attendees,
        });
    });

    it('updates attendees (but only the ones with new update times) when there are new attendees', () => {
        const oldEventData: CalendarEvent = {
            ...dummyEventData,
        };
        const newEventData: CalendarEvent = {
            ...oldEventData,
            AttendeesInfo: {
                Attendees: [
                    {
                        ...dummyAttendee,
                        // status changed
                        Status: ATTENDEE_STATUS_API.ACCEPTED,
                    },
                    {
                        ID: 'attendee-2',
                        Token: 'token-2',
                        Status: ATTENDEE_STATUS_API.TENTATIVE,
                        UpdateTime: dummyModifyTime + 1,
                    },
                ],
                MoreAttendees: ATTENDEE_MORE_ATTENDEES.NO,
            },
        };

        expect(getHasUpdatedAttendees(newEventData, oldEventData)).toEqual({
            hasUpdatedAttendees: true,
            attendees: [dummyAttendee, newEventData.AttendeesInfo.Attendees[1]],
        });
    });

    it('updates attendees (but only the ones with new update times) when some attendees got removed', () => {
        const oldEventData: CalendarEvent = {
            ...dummyEventData,
            AttendeesInfo: {
                Attendees: [
                    dummyAttendee,
                    {
                        ID: 'attendee-2',
                        Token: 'token-2',
                        Status: ATTENDEE_STATUS_API.TENTATIVE,
                        UpdateTime: dummyModifyTime,
                    },
                ],
                MoreAttendees: ATTENDEE_MORE_ATTENDEES.NO,
            },
        };
        const newEventData: CalendarEvent = {
            ...oldEventData,
            AttendeesInfo: {
                Attendees: [
                    {
                        ...dummyAttendee,
                        // status changed
                        Status: ATTENDEE_STATUS_API.ACCEPTED,
                    },
                ],
                MoreAttendees: ATTENDEE_MORE_ATTENDEES.NO,
            },
        };

        expect(getHasUpdatedAttendees(newEventData, oldEventData)).toEqual({
            hasUpdatedAttendees: true,
            attendees: [dummyAttendee],
        });
    });

    it('updates the attendees with new update times', () => {
        const oldEventData = {
            ...dummyEventData,
            AttendeesInfo: {
                Attendees: [
                    dummyAttendee,
                    {
                        ID: 'attendee-2',
                        Token: 'token-2',
                        Status: ATTENDEE_STATUS_API.TENTATIVE,
                        UpdateTime: dummyModifyTime,
                    },
                ],
                MoreAttendees: ATTENDEE_MORE_ATTENDEES.NO,
            },
        };
        const newEventData = {
            ...oldEventData,
            AttendeesInfo: {
                Attendees: [
                    {
                        ...dummyAttendee,
                        // status changed
                        Status: ATTENDEE_STATUS_API.ACCEPTED,
                    },
                    {
                        ID: 'attendee-2',
                        Token: 'token-2',
                        Status: ATTENDEE_STATUS_API.TENTATIVE,
                        UpdateTime: dummyModifyTime + 1,
                    },
                ],
                MoreAttendees: ATTENDEE_MORE_ATTENDEES.NO,
            },
        };

        expect(getHasUpdatedAttendees(newEventData, oldEventData)).toEqual({
            hasUpdatedAttendees: true,
            attendees: [dummyAttendee, newEventData.AttendeesInfo.Attendees[1]],
        });
    });
});

describe('getHasUpdatedEventData', () => {
    it('does not return updated shared data if ModifyTime has not changed (both old and new event contain just shared data)', () => {
        const oldEventData = { ...dummySharedData };
        const newEventData = {
            ...dummySharedData,
            // isOrganizer changed
            IsOrganizer: 1 as const,
        };
        expect(getHasUpdatedEventData(newEventData, oldEventData)).toEqual({
            hasUpdatedEventData: false,
            eventData: oldEventData,
        });
    });

    it('returns updated shared data if ModifyTime has changed (both old and new event contain just shared data)', () => {
        const oldEventData = { ...dummySharedData };
        const newEventData = {
            ...dummySharedData,
            // isOrganizer changed
            IsOrganizer: 1 as const,
            ModifyTime: dummyModifyTime + 1,
        };
        expect(getHasUpdatedEventData(newEventData, oldEventData)).toEqual({
            hasUpdatedEventData: true,
            eventData: newEventData,
        });
    });

    it('returns new event (complete) data when the old event only has shared data, even if ModifyTime has not changed', () => {
        const oldEventData = { ...dummySharedData };
        const newEventData = { ...dummyEventData };
        expect(getHasUpdatedEventData(newEventData, oldEventData)).toEqual({
            hasUpdatedEventData: true,
            eventData: newEventData,
        });
    });

    it('always returns new event data if ModifyTime has increased', () => {
        // no old event data
        expect(getHasUpdatedEventData(dummySharedData)).toEqual({
            hasUpdatedEventData: true,
            eventData: dummySharedData,
        });
        expect(getHasUpdatedEventData(dummyEventData)).toEqual({
            hasUpdatedEventData: true,
            eventData: dummyEventData,
        });

        // old shared data
        const oldEventSharedData = { ...dummySharedData, ModifyTime: dummyModifyTime - 1 };
        expect(getHasUpdatedEventData(dummySharedData, oldEventSharedData)).toEqual({
            hasUpdatedEventData: true,
            eventData: dummySharedData,
        });
        expect(getHasUpdatedEventData(dummyEventData, oldEventSharedData)).toEqual({
            hasUpdatedEventData: true,
            eventData: dummyEventData,
        });

        // old full data
        const oldEventData = { ...dummyEventData, ModifyTime: dummyModifyTime - 1 };
        expect(getHasUpdatedEventData(dummySharedData, oldEventData)).toEqual({
            hasUpdatedEventData: true,
            eventData: dummySharedData,
        });
        expect(getHasUpdatedEventData(dummyEventData, oldEventData)).toEqual({
            hasUpdatedEventData: true,
            eventData: dummyEventData,
        });
    });

    it('returns old event data if ModifyTime is not changed (both old and new data are full)', () => {
        const oldEventData = { ...dummyEventData };
        const newEventData = {
            ...dummyEventData,
            // isOrganizer changed
            IsOrganizer: 1 as const,
        };
        expect(getHasUpdatedEventData(newEventData, oldEventData)).toEqual({
            hasUpdatedEventData: false,
            eventData: oldEventData,
        });
    });

    it('returns old event data but new attendees if attendees have been modified', () => {
        const oldEventData = { ...dummyEventData };
        const newEventData = {
            ...dummyEventData,
            // isOrganizer changed
            IsOrganizer: 1 as const,
            AttendeesInfo: {
                Attendees: [
                    {
                        ...dummyAttendee,
                        // status changed
                        Status: ATTENDEE_STATUS_API.ACCEPTED,
                    },
                    {
                        ID: 'attendee-2',
                        Token: 'token-2',
                        Status: ATTENDEE_STATUS_API.TENTATIVE,
                        UpdateTime: dummyModifyTime + 1,
                    },
                ],
                MoreAttendees: ATTENDEE_MORE_ATTENDEES.NO,
            },
        };

        expect(getHasUpdatedEventData(newEventData, oldEventData)).toEqual({
            hasUpdatedEventData: true,
            eventData: {
                ...oldEventData,
                AttendeesInfo: {
                    Attendees: [
                        dummyAttendee,
                        {
                            ID: 'attendee-2',
                            Token: 'token-2',
                            Status: ATTENDEE_STATUS_API.TENTATIVE,
                            UpdateTime: dummyModifyTime + 1,
                        },
                    ],
                    MoreAttendees: ATTENDEE_MORE_ATTENDEES.NO,
                },
            },
        });
    });

    it('returns new event data but old attendees if attendees have not been modified', () => {
        const oldEventData = { ...dummyEventData };
        const newEventData = {
            ...dummyEventData,
            // isOrganizer changed
            IsOrganizer: 1 as const,
            ModifyTime: dummyModifyTime + 1,
            AttendeesInfo: {
                Attendees: [
                    {
                        ...dummyAttendee,
                        // status changed
                        Status: ATTENDEE_STATUS_API.ACCEPTED,
                    },
                ],
                MoreAttendees: ATTENDEE_MORE_ATTENDEES.NO,
            },
        };

        expect(getHasUpdatedEventData(newEventData, oldEventData)).toEqual({
            hasUpdatedEventData: true,
            eventData: {
                ...newEventData,
                AttendeesInfo: {
                    Attendees: oldEventData.AttendeesInfo.Attendees,
                    MoreAttendees: ATTENDEE_MORE_ATTENDEES.NO,
                },
            },
        });
    });

    it("returns old event data and old attendees when ModifyTime and UpdateTime's are not changed", () => {
        const oldEventData = { ...dummyEventData };
        const newEventData = {
            ...dummyEventData,
            // isOrganizer changed
            IsOrganizer: 1 as const,
            Attendees: [
                {
                    ...dummyAttendee,
                    // status changed
                    Status: ATTENDEE_STATUS_API.ACCEPTED,
                },
            ],
        };

        expect(getHasUpdatedEventData(newEventData, oldEventData)).toEqual({
            hasUpdatedEventData: false,
            eventData: oldEventData,
        });
    });
});
