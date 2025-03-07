import WorkerMessageBroker from 'proton-pass-extension/app/worker/channel';
import type { Store } from 'redux';

import type { PassCoreProxy } from '@proton/pass/lib/core/types';
import { createMonitorService as createCoreMonitorService } from '@proton/pass/lib/monitor/service';
import { WorkerMessageType } from '@proton/pass/types';

export const createMonitorService = (core: PassCoreProxy, store: Store) => {
    const service = createCoreMonitorService(core, store);

    WorkerMessageBroker.registerMessage(WorkerMessageType.MONITOR_2FAS, async ({ payload }) => ({
        result: await service.checkMissing2FAs(payload),
    }));

    WorkerMessageBroker.registerMessage(WorkerMessageType.MONITOR_WEAK_PASSWORDS, async ({ payload }) => ({
        result: await service.checkWeakPasswords(payload),
    }));

    return service;
};
