import { WorkerMessageType } from '@proton/pass/types';
import { withPayloadLens } from '@proton/pass/utils/fp';
import { logger } from '@proton/pass/utils/logger';

import WorkerMessageBroker from '../channel';

const LOG_BUFFER_MAX_LENGTH = 200;

export const createLoggerService = () => {
    const buffer: string[] = [];

    const pushLog = (message: string): boolean => {
        buffer.unshift(`${new Date().toUTCString()} ${message}`);

        if (buffer.length > LOG_BUFFER_MAX_LENGTH) {
            buffer.pop();
        }

        return true;
    };

    WorkerMessageBroker.registerMessage(WorkerMessageType.LOG_EVENT, withPayloadLens('log', pushLog));
    WorkerMessageBroker.registerMessage(WorkerMessageType.LOG_REQUEST, () => ({ logs: buffer }));

    logger.setLogOptions({
        onLog: (log, originalLog) => {
            pushLog(log);
            return ENV === 'development' && originalLog(log);
        },
    });

    return { pushLog };
};

export type LoggerService = ReturnType<typeof createLoggerService>;
