import WorkerMessageBroker from 'proton-pass-extension/app/worker/channel';
import { WorkerMessageType } from 'proton-pass-extension/types/messages';

import { createPassCoreMainThreadService } from '@proton/pass/lib/core/core.main.service';
import { createPassCoreProxy } from '@proton/pass/lib/core/core.proxy';
import type { PassCoreMethod, PassCoreResult } from '@proton/pass/lib/core/core.types';

export const createPassCoreProxyService = () => {
    const core = createPassCoreMainThreadService();
    const service = createPassCoreProxy(core);

    WorkerMessageBroker.registerMessage(WorkerMessageType.PASS_CORE_RPC, async ({ payload }) => ({
        result: (await core.exec(payload.method, ...payload.args)) as PassCoreResult<PassCoreMethod>,
    }));

    return service;
};
