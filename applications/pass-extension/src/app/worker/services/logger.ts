import WorkerMessageBroker from 'proton-pass-extension/app/worker/channel';
import { WorkerMessageType } from 'proton-pass-extension/types/messages';

import { type LogStorageData, createLogStore } from '@proton/pass/lib/logger/store';
import { type ExtensionStorage } from '@proton/pass/types';
import { withPayloadLens } from '@proton/pass/utils/fp/lens';
import { registerLoggerEffect } from '@proton/pass/utils/logger';

export const createLoggerService = (storage: ExtensionStorage<LogStorageData>) => {
    const { push, read } = createLogStore(storage);

    registerLoggerEffect(push);

    WorkerMessageBroker.registerMessage(WorkerMessageType.LOG_EVENT, withPayloadLens('log', push));
    WorkerMessageBroker.registerMessage(WorkerMessageType.LOG_REQUEST, async () => ({ logs: await read() }));

    return { push, read };
};

export type LoggerService = ReturnType<typeof createLoggerService>;
