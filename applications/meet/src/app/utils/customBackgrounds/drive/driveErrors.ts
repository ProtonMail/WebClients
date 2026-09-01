import { AbortError, ConnectionError, RateLimitedError, ServerError } from '@proton/drive';

export const isTransientDriveError = (error: unknown): boolean => {
    if (error instanceof ConnectionError || error instanceof RateLimitedError || error instanceof AbortError) {
        return true;
    }

    if (error instanceof ServerError) {
        return error.statusCode === undefined || error.statusCode >= 500;
    }

    return false;
};
