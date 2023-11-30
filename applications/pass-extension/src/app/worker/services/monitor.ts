import { WorkerMessageType } from '@proton/pass/types';

import WorkerMessageBroker from '../channel';
import { withContext } from '../context';

export const createMonitorService = () => {
    WorkerMessageBroker.registerMessage(
        WorkerMessageType.ANALYZE_PASSWORD,
        withContext((ctx, { payload }) => ctx.service.core.bindings!.analyze_password(payload.password))
    );

    return {};
};

export type MonitorService = ReturnType<typeof createMonitorService>;
