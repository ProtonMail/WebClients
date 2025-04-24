import type { PassCoreMethodMap } from '@proton/pass/lib/core/core.types';
import { wasmWorkerServiceFactory } from '@proton/pass/lib/core/wasm.worker.service';

export const PassCoreWorkerService = wasmWorkerServiceFactory<PassCoreMethodMap>({
    id: 'PassCoreWorker',
    spawn: () =>
        new Worker(
            /* webpackChunkName: "pass-core.worker" */
            new URL('@proton/pass/lib/core/core.worker', import.meta.url)
        ),
});
