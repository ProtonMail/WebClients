import type { PassUIMethod, PassUIParams, PassUIResult } from '@proton/pass/lib/core/ui.types';
import { wasmWorkerServiceFactory } from '@proton/pass/lib/core/wasm.worker.service';

export const PassUIWorkerService = wasmWorkerServiceFactory<{
    [K in PassUIMethod]: {
        args: PassUIParams<K>;
        return: PassUIResult<K>;
    };
}>({
    id: 'PassUIWorker',
    spawn: () =>
        new Worker(
            /* webpackChunkName: "pass-ui.worker" */
            new URL('@proton/pass/lib/core/ui.worker', import.meta.url)
        ),
});
