import { vi } from 'vitest';

import { parse } from '@proton/shared/lib/calendar/vcal';
import type { CalendarEvent } from '@proton/shared/lib/interfaces/calendar/Event';
import type { VcalVeventComponent } from '@proton/shared/lib/interfaces/calendar/VcalModel';

import type { SyncMultipleEventsArguments } from './getSyncMultipleEventsPayload';
import getSyncMultipleEventsPayload, { SyncOperationTypes } from './getSyncMultipleEventsPayload';

vi.mock('@proton/shared/lib/calendar/serialize', () => ({
    createCalendarEvent: vi.fn(() => ({})),
}));

vi.mock('@proton/shared/lib/calendar/apiModels', () => ({
    getHasSharedKeyPacket: vi.fn(() => true),
}));

vi.mock('@proton/shared/lib/calendar/crypto/keys/helpers', () => ({
    getCreationKeys: vi.fn(() => ({})),
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
            getCalendarKeys: vi.fn(),
            getAddressKeys: vi.fn(),
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
