import { vi } from 'vitest';

import * as attendeeInfosModule from '@proton/shared/lib/calendar/attendeeInfos';

import getAllEventsByUID from './getAllEventsByUID';

vi.mock('@proton/shared/lib/calendar/attendeeInfos');

const api = vi.fn();

describe('getAllEventsByUID', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should return all events by UID', async () => {
        api.mockResolvedValue({
            Events: [],
        });
        const events = await getAllEventsByUID(api, 'calendarID', 'UID');
        expect(events).toEqual([]);
        expect(api).toHaveBeenCalledTimes(1);
    });

    it('It should call fetchPaginatedAttendeesInfo when there are paginated attendees', async () => {
        api.mockResolvedValueOnce({
            Events: [
                {
                    UID: 'UID',
                    AttendeesInfo: {
                        Attendees: [{ UID: 'UID' }],
                        MoreAttendees: true,
                    },
                },
            ],
        }).mockResolvedValueOnce({
            Events: [
                {
                    UID: 'UID',
                    AttendeesInfo: {
                        Attendees: [{ UID: 'UID' }],
                        MoreAttendees: false,
                    },
                },
            ],
        });
        vi.spyOn(attendeeInfosModule, 'fetchPaginatedAttendeesInfo');

        const events = await getAllEventsByUID(api, 'calendarID', 'UID');
        expect(events.length).toBe(1);
        expect(api).toHaveBeenCalledTimes(1);
        expect(attendeeInfosModule.fetchPaginatedAttendeesInfo).toHaveBeenCalledTimes(1);
    });
});
