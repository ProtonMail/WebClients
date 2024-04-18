import type { PassCoreService } from '@proton/pass/lib/core/service';
import { createMonitorService as createCoreMonitorService } from '@proton/pass/lib/monitor/service';
import { WorkerMessageType } from '@proton/pass/types';

import WorkerMessageBroker from '../channel';

export const createMonitorService = (core: PassCoreService) => {
    const service = createCoreMonitorService(core);

    WorkerMessageBroker.registerMessage(WorkerMessageType.MONITOR_PASSWORD, async ({ payload }) => ({
        result: await service.analyzePassword(payload.password),
    }));

    WorkerMessageBroker.registerMessage(WorkerMessageType.MONITOR_2FAS, async ({ payload }) => ({
        result: await service.checkMissing2FAs(payload.items),
    }));

    return service;
};

export type MonitorService = ReturnType<typeof createMonitorService>;
