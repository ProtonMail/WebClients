import { logger } from '@proton/logger';

import type { WorkerLogLevel } from './workerLogger';

// Use on the main thread inside a worker's onmessage handler.
// Returns true when the event was a log (so the caller can bail out of its own handling).
export const forwardWorkerLog = (data: any): boolean => {
    if (!data?.__workerLog) {
        return false;
    }

    (logger[data.level as WorkerLogLevel] ?? logger.info)(`[${data.source}] ${data.message}`, ...data.args);
    return true;
};
