import type { Meeting } from '@proton/shared/lib/interfaces/Meet';
import { MeetingType } from '@proton/shared/lib/interfaces/Meet';

import { generateMeetingLinkFromMeeting } from './generateMeetingLinkFromMeeting';

describe('generateMeetingLinkFromMeeting', () => {
    const mockOrigin = 'https://meet.proton.me';
    const originalLocation = window.location;

    beforeAll(() => {
        Object.defineProperty(window, 'location', {
            value: {
                origin: mockOrigin,
            },
            writable: true,
        });
    });

    afterAll(() => {
        Object.defineProperty(window, 'location', {
            value: originalLocation,
            writable: true,
        });
    });

    const createMockMeeting = (overrides?: Partial<Meeting>): Meeting => ({
        ID: 'meeting-id',
        MeetingName: 'Test Meeting',
        MeetingLinkName: 'abcdefghij',
        Password: 'testpassword_encrypted',
        AddressID: null,
        Salt: 'salt',
        SessionKey: 'session-key',
        SRPModulusID: 'modulus-id',
        SRPSalt: 'srp-salt',
        SRPVerifier: 'srp-verifier',
        StartTime: null,
        EndTime: null,
        RRule: null,
        Timezone: null,
        Type: MeetingType.INSTANT,
        CustomPassword: 0,
        CreateTime: 0,
        LastUsedTime: null,
        ...overrides,
    });

    it('should generate meeting link from Meeting object with full URL', async () => {
        const meeting = createMockMeeting({
            MeetingLinkName: 'abcdefghij',
            Password: 'password123_encryptedpart',
        });

        const result = await generateMeetingLinkFromMeeting(meeting);

        expect(result).toBe('https://meet.proton.me/join/id-abcdefghij#pwd-password123');
    });

    it('should handle password without separator', async () => {
        const meeting = createMockMeeting({
            MeetingLinkName: 'testmeeting',
            Password: 'simplepass',
        });

        const result = await generateMeetingLinkFromMeeting(meeting);

        expect(result).toBe('https://meet.proton.me/join/id-testmeeting#pwd-simplepass');
    });

    it('should throw error if password is null', async () => {
        const meeting = createMockMeeting({
            Password: null,
        });

        await expect(generateMeetingLinkFromMeeting(meeting)).rejects.toThrow(
            'Meeting password is required to generate meeting link'
        );
    });

    it('should throw error if password is empty after split', async () => {
        const meeting = createMockMeeting({
            Password: '_encryptedonly',
        });

        await expect(generateMeetingLinkFromMeeting(meeting)).rejects.toThrow('Invalid meeting password format');
    });
});
