import { EnrichedError } from './EnrichedError';

export const is4xx = (status: number) => status >= 400 && status < 500;

export const is5xx = (status: number) => status >= 500 && status < 600;

export const isCryptoEnrichedError = (error: unknown) =>
    error instanceof EnrichedError &&
    typeof error.context === 'object' &&
    error.context.extra &&
    error.context.extra.crypto;
