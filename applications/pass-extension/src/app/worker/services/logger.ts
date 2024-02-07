import { type LogStorageData, createLogStore } from '@proton/pass/lib/logger/store';
import { type ExtensionStorage, WorkerMessageType } from '@proton/pass/types';
import { withPayloadLens } from '@proton/pass/utils/fp/lens';
import { logger } from '@proton/pass/utils/logger';

import WorkerMessageBroker from '../channel';

export const createLoggerService = (storage: ExtensionStorage<LogStorageData>) => {
    const { push, read } = createLogStore(storage);

    logger.setLogOptions({
        onLog: (log, originalLog) => {
            if (ENV === 'development') originalLog(log);
            push(log);
        },
    });

    WorkerMessageBroker.registerMessage(WorkerMessageType.LOG_EVENT, withPayloadLens('log', push));
    WorkerMessageBroker.registerMessage(WorkerMessageType.LOG_REQUEST, async () => ({ logs: await read() }));

    return { push, read };
};

export type LoggerService = ReturnType<typeof createLoggerService>;
