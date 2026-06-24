import { getTerminalTypeFromApiError, mapStreamErrorCode } from './generation-terminal';

describe('mapStreamErrorCode', () => {
    it('maps known codes to legacy terminal types', () => {
        expect(mapStreamErrorCode('timeout')).toBe('timeout');
        expect(mapStreamErrorCode('rejected')).toBe('rejected');
        expect(mapStreamErrorCode('error')).toBe('error');
    });

    it('falls back to error for unknown codes', () => {
        expect(mapStreamErrorCode('something_else')).toBe('error');
        expect(mapStreamErrorCode('context_length_exceeded')).toBe('error');
        expect(mapStreamErrorCode(undefined)).toBe('error');
    });
});

describe('getTerminalTypeFromApiError', () => {
    it('reads terminal codes from structured error bodies', () => {
        const rejectedBody = {
            error: {
                message: 'Request was rejected due to high demand. Please try again later.',
                type: 'server_error',
                code: 'rejected',
            },
        };

        expect(
            getTerminalTypeFromApiError({
                status: 503,
                data: rejectedBody,
            })
        ).toBe('rejected');

        expect(
            getTerminalTypeFromApiError({
                status: 503,
                data: {
                    error: {
                        message: 'Request timed out waiting for capacity. Please try again.',
                        type: 'server_error',
                        code: 'timeout',
                    },
                },
            })
        ).toBe('timeout');

        expect(
            getTerminalTypeFromApiError({
                status: 500,
                data: {
                    error: {
                        message: 'An error occurred during generation.',
                        type: 'server_error',
                        code: 'error',
                    },
                },
            })
        ).toBe('error');
    });

    it('reads terminal codes from top-level API error codes', () => {
        expect(
            getTerminalTypeFromApiError({
                data: { Code: 'timeout', Error: 'High demand' },
            })
        ).toBe('timeout');
    });

    it('returns null when no terminal code is present', () => {
        expect(getTerminalTypeFromApiError({ data: { error: { code: 'context_length_exceeded' } } })).toBeNull();
        expect(getTerminalTypeFromApiError({ message: 'Internal Server Error' })).toBeNull();
        expect(getTerminalTypeFromApiError(null)).toBeNull();
    });
});
