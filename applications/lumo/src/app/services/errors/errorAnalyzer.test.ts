import { API_CUSTOM_ERROR_CODES, HTTP_ERROR_CODES } from '@proton/shared/lib/errors';

import { LUMO_API_ERRORS } from '../../types';
import { analyzeError } from './errorAnalyzer';

describe('analyzeError', () => {
    it('maps BANNED API code to tier limit', () => {
        const result = analyzeError({
            status: HTTP_ERROR_CODES.TOO_MANY_REQUESTS,
            data: {
                Code: API_CUSTOM_ERROR_CODES.BANNED,
                Error: 'Too many requests. Please try again later.',
            },
        });

        expect(result.lumoErrorType).toBe(LUMO_API_ERRORS.TIER_LIMIT);
        expect(result.isRetryable).toBe(false);
    });

    it('maps HTTP 429 without custom code to tier limit', () => {
        const result = analyzeError({ status: HTTP_ERROR_CODES.TOO_MANY_REQUESTS });

        expect(result.lumoErrorType).toBe(LUMO_API_ERRORS.TIER_LIMIT);
    });

    it('prioritizes HTTP 429 over a nested terminal error code', () => {
        const result = analyzeError({
            status: HTTP_ERROR_CODES.TOO_MANY_REQUESTS,
            data: {
                error: {
                    code: 'error',
                    message: 'Too many requests. Please try again later.',
                },
            },
        });

        expect(result.lumoErrorType).toBe(LUMO_API_ERRORS.TIER_LIMIT);
        expect(result.isRetryable).toBe(false);
    });

    it('prioritizes HTTP 429 over an annotated Lumo error type', () => {
        const result = analyzeError({
            status: HTTP_ERROR_CODES.TOO_MANY_REQUESTS,
            type: LUMO_API_ERRORS.GENERATION_ERROR,
        });

        expect(result.lumoErrorType).toBe(LUMO_API_ERRORS.TIER_LIMIT);
        expect(result.isRetryable).toBe(false);
    });
});
