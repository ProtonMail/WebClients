import { ICAL_ATTENDEE_RSVP } from '@proton/shared/lib/calendar/constants';

import { propertiesToAttendeeModel } from './propertiesToAttendeeModel';

describe('propertiesToAttendeeModel', () => {
    it('should return empty array when no attendees are provided', () => {
        const result = propertiesToAttendeeModel();
        expect(result).toEqual([]);
    });

    it('should return empty array when attendees array is empty', () => {
        const result = propertiesToAttendeeModel([]);
        expect(result).toEqual([]);
    });

    it('should convert valid attendee properties to attendee model', () => {
        const attendees = [
            {
                value: 'mailto:test@example.com',
                parameters: {
                    cn: 'Test User',
                    partstat: 'ACCEPTED',
                    role: 'REQ-PARTICIPANT',
                    'x-pm-token': 'token123',
                    'x-pm-comment': 'Test comment',
                },
            },
        ];

        const result = propertiesToAttendeeModel(attendees);

        expect(result).toEqual([
            {
                email: 'test@example.com',
                rsvp: ICAL_ATTENDEE_RSVP.TRUE,
                cn: 'Test User',
                partstat: 'ACCEPTED',
                role: 'REQ-PARTICIPANT',
                token: 'token123',
                comment: 'Test comment',
            },
        ]);
    });

    it('should use email as cn when cn parameter is not provided', () => {
        const attendees = [
            {
                value: 'mailto:test@example.com',
                parameters: {
                    partstat: 'ACCEPTED',
                    role: 'REQ-PARTICIPANT',
                },
            },
        ];

        const result = propertiesToAttendeeModel(attendees);

        expect(result[0].cn).toBe('test@example.com');
    });

    it('should filter out malformed attendees', () => {
        const attendees = [{ value: 'mailto:test@example.com' }, { value: 'undefined' }, { value: '' }];

        const result = propertiesToAttendeeModel(attendees);

        expect(result).toHaveLength(1);
        expect(result[0].email).toBe('test@example.com');
    });

    it('should handle attendees with minimal properties', () => {
        const attendees = [
            {
                value: 'mailto:minimal@example.com',
            },
        ];

        const result = propertiesToAttendeeModel(attendees);

        expect(result).toEqual([
            {
                email: 'minimal@example.com',
                rsvp: ICAL_ATTENDEE_RSVP.TRUE,
                cn: 'minimal@example.com',
                // Add default partstat
                partstat: 'NEEDS-ACTION',
                // Add default role
                role: 'REQ-PARTICIPANT',
                token: undefined,
                comment: undefined,
            },
        ]);
    });
});
