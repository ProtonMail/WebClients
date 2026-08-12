import { describe, expect, it } from 'vitest';

import { isExpectedApiFailure } from './isExpectedApiFailure';

// Shapes taken from the "Error initializing handshake" events in production
const apiError = (Code: number, Error: string, status = 400) => ({
    name: 'StatusCodeError',
    status,
    data: { Code, Error, Details: [] },
});

describe('isExpectedApiFailure', () => {
    it.each([
        ['a dead meeting link', apiError(2501, 'Meeting does not exist')],
        ['a rate limit', apiError(2028, 'Too many requests', 429)],
        ['no network', { name: 'OfflineError', message: 'No network connection', status: 0 }],
        ['a timed out request', { name: 'TimeoutError', message: 'Request timed out', status: -1 }],
        ['a dead session', { name: 'InactiveSession', message: 'Inactive session' }],
        ['an error already shown to the user', { ...apiError(2026, 'Invalid SRP parameter'), userNotified: true }],
    ])('does not report %s', (_label, error) => {
        expect(isExpectedApiFailure(error)).toBe(true);
    });

    it.each([
        ['an invalid meeting link name', apiError(2002, 'Attribute MeetingLinkName is invalid')],
        ['a unexpected error', new Error('Failed to decrypt the meeting name')],
        ['an unknown API code', apiError(9999, 'Something new')],
        ['a server error', { name: 'StatusCodeError', status: 500 }],
        ['an unavailable service', { name: 'StatusCodeError', status: 503 }],
        ['a bad gateway', { name: 'StatusCodeError', status: 502, data: {} }],
    ])('reports %s', (_label, error) => {
        expect(isExpectedApiFailure(error)).toBe(false);
    });

    it('reports nothing when there is no error', () => {
        expect(isExpectedApiFailure(undefined)).toBe(false);
    });
});
