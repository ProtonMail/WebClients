import WorkerMessageBroker from 'proton-pass-extension/app/worker/channel';
import { sendDebugLog } from 'proton-pass-extension/app/worker/debugger';
import type { MessageHandlerCallback } from 'proton-pass-extension/lib/message/message-broker';
import { WorkerMessageType } from 'proton-pass-extension/types/messages';

import { type LogStorageData, createLogStore } from '@proton/pass/lib/logger/store';
import { type ExtensionStorage } from '@proton/pass/types';
import { registerLoggerEffect } from '@proton/pass/utils/logger';

export const createLoggerService = (storage: ExtensionStorage<LogStorageData>) => {
    const { push, read, clear } = createLogStore(storage);

    registerLoggerEffect(push);

    const onLog: MessageHandlerCallback<WorkerMessageType.LOG_EVENT> = ({ payload: { log } }) => {
        if (HTTP_DEBUGGER) sendDebugLog('debug', log);
        push(log);
        return true;
    };

    WorkerMessageBroker.registerMessage(WorkerMessageType.LOG_EVENT, onLog);
    WorkerMessageBroker.registerMessage(WorkerMessageType.LOG_REQUEST, async () => ({ logs: await read() }));

    return { push, read, clear };
};

export type LoggerService = ReturnType<typeof createLoggerService>;
