import WorkerMessageBroker from 'proton-pass-extension/app/worker/channel';

import { createPassCoreProxy } from '@proton/pass/lib/core/proxy';
import { createPassCoreSyncService } from '@proton/pass/lib/core/sync.service';
import type { PassCoreMethod, PassCoreResult } from '@proton/pass/lib/core/types';
import { WorkerMessageType } from '@proton/pass/types';

export const createPassCoreProxyService = () => {
    const core = createPassCoreSyncService();
    const service = createPassCoreProxy(core);

    WorkerMessageBroker.registerMessage(WorkerMessageType.PASS_CORE_RPC, async ({ payload }) => ({
        result: (await core.exec(payload.method, ...payload.args)) as PassCoreResult<PassCoreMethod>,
    }));

    return service;
};
