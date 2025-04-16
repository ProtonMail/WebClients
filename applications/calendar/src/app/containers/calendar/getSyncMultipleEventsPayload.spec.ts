import { parse } from '@proton/shared/lib/calendar/vcal';
import type { CalendarEvent, VcalVeventComponent } from '@proton/shared/lib/interfaces/calendar';

import type { SyncMultipleEventsArguments } from './getSyncMultipleEventsPayload';
import getSyncMultipleEventsPayload, { SyncOperationTypes } from './getSyncMultipleEventsPayload';

jest.mock('@proton/shared/lib/calendar/serialize', () => ({
    createCalendarEvent: jest.fn(() => ({})),
}));

jest.mock('@proton/shared/lib/calendar/apiModels', () => ({
    getHasSharedKeyPacket: jest.fn(() => true),
}));

jest.mock('@proton/shared/lib/calendar/crypto/keys/helpers', () => ({
    getCreationKeys: jest.fn(() => ({})),
}));

describe('getSyncMultipleEventsPayload', () => {
    it('adds SourceCalendarID to the payload when switching calendars', async () => {
        const vevent = `BEGIN:VEVENT
UID:uid
DTSTART;TZID=America/New_York:20190719T120000
DTEND;TZID=Europe/Zurich:20190719T183000
SUMMARY:My title
END:VEVENT`;
        const calendarEvent = {
            CalendarID: 'oldCalendarID',
        } as CalendarEvent;
        const vcalVeventComponent = parse(vevent) as VcalVeventComponent;
        const payload: SyncMultipleEventsArguments = {
            sync: {
                calendarID: 'calendarID',
                memberID: 'memberID',
                addressID: 'addressID',
                operations: [
                    {
                        type: SyncOperationTypes.UPDATE,
                        data: {
                            calendarEvent,
                            isAttendee: false,
                            veventComponent: vcalVeventComponent,
                            removedAttendeesEmails: [],
                            hasDefaultNotifications: false,
                            resetNotes: true,
                            // @ts-expect-error mock
                            getAttendeeEncryptedComment: () => null,
                        },
                    },
                ],
            },
            getCalendarKeys: jest.fn(),
            getAddressKeys: jest.fn(),
        };

        expect(await getSyncMultipleEventsPayload(payload)).toEqual(
            expect.objectContaining({
                data: {
                    Events: [
                        {
                            Event: expect.objectContaining({ SourceCalendarID: 'oldCalendarID' }),
                        },
                    ],
                    MemberID: 'memberID',
                },
            })
        );
    });
});
