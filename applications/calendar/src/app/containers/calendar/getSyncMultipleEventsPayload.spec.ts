import { parse } from '@proton/shared/lib/calendar/vcal';
import { CalendarEvent, VcalVeventComponent } from '@proton/shared/lib/interfaces/calendar';

import getSyncMultipleEventsPayload, {
    SyncMultipleEventsArguments,
    SyncOperationTypes,
} from './getSyncMultipleEventsPayload';

jest.mock('@proton/shared/lib/calendar/serialize', () => ({
    createCalendarEvent: jest.fn(() => ({})),
    getHasSharedKeyPacket: jest.fn(() => true),
}));

jest.mock('@proton/shared/lib/calendar/integration/getCreationKeys', () => ({
    __esModule: true,
    default: jest.fn(() => ({})),
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
