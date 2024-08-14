import { getApiError } from '@proton/shared/lib/api/helpers/apiErrorHelper';

import { EnrichedError } from './EnrichedError';
import { getErrorMetricType } from './apiErrors';

jest.mock('@proton/shared/lib/api/helpers/apiErrorHelper', () => ({
    getApiError: jest.fn(),
}));

const mockGetApiError = jest.mocked(getApiError);

describe('getErrorMetricType', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return "4xx" for 4xx status codes', () => {
        mockGetApiError.mockReturnValue({ status: 404 });
        expect(getErrorMetricType(new Error())).toBe('4xx');

        mockGetApiError.mockReturnValue({ status: 400 });
        expect(getErrorMetricType(new Error())).toBe('4xx');

        mockGetApiError.mockReturnValue({ status: 499 });
        expect(getErrorMetricType(new Error())).toBe('4xx');
    });

    it('should return "5xx" for 5xx status codes', () => {
        mockGetApiError.mockReturnValue({ status: 500 });
        expect(getErrorMetricType(new Error())).toBe('5xx');

        mockGetApiError.mockReturnValue({ status: 503 });
        expect(getErrorMetricType(new Error())).toBe('5xx');

        mockGetApiError.mockReturnValue({ status: 599 });
        expect(getErrorMetricType(new Error())).toBe('5xx');
    });

    it('should return "crypto" for EnrichedError with crypto context', () => {
        mockGetApiError.mockReturnValue({});
        const cryptoError = new EnrichedError('Crypto error');
        cryptoError.context = { extra: { crypto: true } };
        expect(getErrorMetricType(cryptoError)).toBe('crypto');
    });

    it('should return "unknown" for other types of errors', () => {
        mockGetApiError.mockReturnValue({});
        expect(getErrorMetricType(new Error())).toBe('unknown');

        mockGetApiError.mockReturnValue({ status: 'invalid' });
        expect(getErrorMetricType(new Error())).toBe('unknown');

        mockGetApiError.mockReturnValue({ status: 300 });
        expect(getErrorMetricType(new Error())).toBe('unknown');
    });
});
