// utils/errorAnalyzer.ts
import { getApiError } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import { API_CUSTOM_ERROR_CODES } from '@proton/shared/lib/errors';

import { type ErrorContext, LUMO_API_ERRORS } from '../../types';

export interface AnalyzedError {
    category: 'api' | 'network' | 'abort' | 'validation' | 'unknown';
    isRetryable: boolean;
    shouldShowToUser: boolean;
    lumoErrorType?: LUMO_API_ERRORS;
}

export function analyzeError(error: any, context: ErrorContext): AnalyzedError {
    const { code } = getApiError(error);

    // Abort errors - user initiated
    if (error.name === 'AbortError' || error.code === 'AbortError') {
        return {
            category: 'abort',
            isRetryable: false,
            shouldShowToUser: false,
        };
    }

    // Known Lumo API errors
    if (error.type && Object.values(LUMO_API_ERRORS).includes(error.type)) {
        return {
            category: 'api',
            isRetryable: true,
            shouldShowToUser: true,
            lumoErrorType: error.type,
        };
    }

    // Tier limit error - from jails
    if (code === API_CUSTOM_ERROR_CODES.BANNED) {
        return {
            category: 'api',
            isRetryable: false,
            shouldShowToUser: true,
            lumoErrorType: LUMO_API_ERRORS.TIER_LIMIT,
        };
    }

    // Network errors
    if (isNetworkError(error)) {
        return {
            category: 'network',
            isRetryable: true,
            shouldShowToUser: true,
            lumoErrorType: LUMO_API_ERRORS.STREAM_DISCONNECTED,
        };
    }

    // Unknown errors
    return {
        category: 'unknown',
        isRetryable: false,
        shouldShowToUser: true,
    };
}

function isNetworkError(error: any): boolean {
    return (
        error.name === 'NetworkError' ||
        (error.name === 'TypeError' && error.message?.toLowerCase().includes('network')) ||
        error.message?.toLowerCase().includes('fetch') ||
        error.code === 'NETWORK_ERROR'
    );
}
