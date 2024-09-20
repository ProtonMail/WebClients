import { getApiError } from '@proton/shared/lib/api/helpers/apiErrorHelper';

import { getErrorMetricTypeOnPublicPage } from '../../containers/PublicSharedLinkContainer';
import { EnrichedError } from './EnrichedError';

jest.mock('@proton/shared/lib/api/helpers/apiErrorHelper', () => ({
    getApiError: jest.fn(),
}));

const mockGetApiError = jest.mocked(getApiError);

describe('getErrorMetricTypeOnPublicPage', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return "4xx" for 4xx status codes (except 404s)', () => {
        mockGetApiError.mockReturnValue({ status: 408 });
        expect(getErrorMetricTypeOnPublicPage(new Error())).toBe('4xx');

        mockGetApiError.mockReturnValue({ status: 400 });
        expect(getErrorMetricTypeOnPublicPage(new Error())).toBe('4xx');

        mockGetApiError.mockReturnValue({ status: 499 });
        expect(getErrorMetricTypeOnPublicPage(new Error())).toBe('4xx');
    });

    it('should return "does_not_exist_or_expired" for 404 status codes', () => {
        mockGetApiError.mockReturnValue({ status: 404 });
        expect(getErrorMetricTypeOnPublicPage(new Error())).toBe('does_not_exist_or_expired');
    });

    it('should return "5xx" for 5xx status codes', () => {
        mockGetApiError.mockReturnValue({ status: 500 });
        expect(getErrorMetricTypeOnPublicPage(new Error())).toBe('5xx');

        mockGetApiError.mockReturnValue({ status: 503 });
        expect(getErrorMetricTypeOnPublicPage(new Error())).toBe('5xx');

        mockGetApiError.mockReturnValue({ status: 599 });
        expect(getErrorMetricTypeOnPublicPage(new Error())).toBe('5xx');
    });

    it('should return "crypto" for EnrichedError with crypto context', () => {
        mockGetApiError.mockReturnValue({});
        const cryptoError = new EnrichedError('Crypto error');
        cryptoError.context = { extra: { crypto: true } };
        expect(getErrorMetricTypeOnPublicPage(cryptoError)).toBe('crypto');
    });

    it('should return "unknown" for other types of errors', () => {
        mockGetApiError.mockReturnValue({});
        expect(getErrorMetricTypeOnPublicPage(new Error())).toBe('unknown');

        mockGetApiError.mockReturnValue({ status: 'invalid' });
        expect(getErrorMetricTypeOnPublicPage(new Error())).toBe('unknown');

        mockGetApiError.mockReturnValue({ status: 300 });
        expect(getErrorMetricTypeOnPublicPage(new Error())).toBe('unknown');
    });
});
