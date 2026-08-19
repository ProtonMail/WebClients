import { describe, expect, it } from 'vitest';

import { MeetingErrorKind, classifyMeetingError } from './classifyMeetingError';

const apiError = (Code: number, Error: string, status = 400) => ({
    name: 'StatusCodeError',
    status,
    data: { Code, Error, Details: [] },
});

describe('classifyMeetingError', () => {
    it('recognises a meeting that no longer exists', () => {
        expect(classifyMeetingError(apiError(2501, 'Meeting does not exist'))).toBe(MeetingErrorKind.MeetingGone);
    });

    it('recognises a locked meeting', () => {
        expect(classifyMeetingError(apiError(2502, 'Meeting is locked'))).toBe(MeetingErrorKind.MeetingLocked);
    });

    it('recognises a connection timeout coming from LiveKit', () => {
        expect(classifyMeetingError(new Error('Connection timeout after 20000ms'))).toBe(
            MeetingErrorKind.ConnectionFailed
        );
    });

    it('recognises an error the user was already notified about', () => {
        const wrongPassword = { ...apiError(2026, 'Invalid SRP parameter'), userNotified: true };

        expect(classifyMeetingError(wrongPassword)).toBe(MeetingErrorKind.AlreadyNotified);
    });

    it('keeps an already notified error out of the api code branches', () => {
        const notified = { ...apiError(2501, 'Meeting does not exist'), userNotified: true };

        expect(classifyMeetingError(notified)).toBe(MeetingErrorKind.AlreadyNotified);
    });

    it.each([
        ['an unknown api code', apiError(9999, 'Something new')],
        ['a server error', { name: 'StatusCodeError', status: 500 }],
        ['an unexpected error', new Error('Failed to decrypt the meeting name')],
        ['no error at all', undefined],
    ])('falls back to unknown for %s', (_label, error) => {
        expect(classifyMeetingError(error)).toBe(MeetingErrorKind.Unknown);
    });

    it('falls back to unknown when the response carries a code but no error message', () => {
        expect(classifyMeetingError({ name: 'StatusCodeError', status: 400, data: { Code: 2501 } })).toBe(
            MeetingErrorKind.Unknown
        );
    });
});
