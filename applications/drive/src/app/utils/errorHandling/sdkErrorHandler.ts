import { AbortError, ConnectionError, ProtonDriveError, RateLimitedError, ValidationError } from '@proton/drive';

export const isSdkError = (err: Error) => err instanceof ProtonDriveError;

export const shouldTrackError = (err: Error) =>
    !(err instanceof ValidationError) &&
    !(err instanceof AbortError) &&
    !(err instanceof RateLimitedError) &&
    !(err instanceof ConnectionError);
