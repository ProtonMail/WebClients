import type { Store } from 'redux';

import type { PassCoreService } from '@proton/pass/lib/core/service';
import { createMonitorService as createCoreMonitorService } from '@proton/pass/lib/monitor/service';
import { WorkerMessageType } from '@proton/pass/types';

import WorkerMessageBroker from '../channel';

export const createMonitorService = (core: PassCoreService, store: Store) => {
    const service = createCoreMonitorService(core, store);

    WorkerMessageBroker.registerMessage(WorkerMessageType.MONITOR_PASSWORD, ({ payload }) => ({
        result: service.analyzePassword(payload.password),
    }));

    WorkerMessageBroker.registerMessage(WorkerMessageType.MONITOR_2FAS, () => ({
        result: service.checkMissing2FAs(),
    }));

    WorkerMessageBroker.registerMessage(WorkerMessageType.MONITOR_WEAK_PASSWORDS, () => ({
        result: service.checkWeakPasswords(),
    }));

    return service;
};

export type MonitorService = ReturnType<typeof createMonitorService>;
