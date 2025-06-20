import { useNotifications } from '@proton/components';
import { AbortError, ConnectionError, ProtonDriveError, RateLimitedError, ValidationError } from '@proton/drive';

import { sendErrorReport } from '../../utils/errorHandling';
import { EnrichedError } from '../../utils/errorHandling/EnrichedError';

export const isSdkError = (err: Error) => err instanceof ProtonDriveError;

export const shouldTrackError = (err: Error) =>
    !(err instanceof ValidationError) &&
    !(err instanceof AbortError) &&
    !(err instanceof RateLimitedError) &&
    !(err instanceof ConnectionError);

export const useSdkErrorHandler = () => {
    const { createNotification } = useNotifications();

    const handleError = (error: Error, fallbackMessage?: string, extra?: {}) => {
        const message = error?.message || fallbackMessage;
        createNotification({ type: 'error', text: message, preWrap: true });
        if (shouldTrackError(error)) {
            sendErrorReport(new EnrichedError(error.message, { tags: { component: 'drive-sdk' }, extra }));
        }
    };
    return {
        handleError,
    };
};
