import { HTTP_ERROR_CODES } from '@proton/shared/lib/errors';

import { getTerminalTypeForApiError } from './lumoApiClientRedux';

describe('getTerminalTypeForApiError', () => {
    it('does not convert HTTP 429 responses into generic terminal errors', () => {
        expect(
            getTerminalTypeForApiError({
                status: HTTP_ERROR_CODES.TOO_MANY_REQUESTS,
                data: {
                    error: {
                        code: 'error',
                        message: 'Too many requests. Please try again later.',
                    },
                },
            })
        ).toBeNull();
    });

    it('continues to detect terminal errors for other HTTP statuses', () => {
        expect(
            getTerminalTypeForApiError({
                status: HTTP_ERROR_CODES.SERVICE_UNAVAILABLE,
                data: {
                    error: {
                        code: 'rejected',
                        message: 'Request rejected due to high demand.',
                    },
                },
            })
        ).toBe('rejected');
    });
});
