import type { PassCoreMethodMap } from './core.types';
import { wasmWorkerServiceFactory } from './wasm.worker.service';

export const PassCoreWorkerService = wasmWorkerServiceFactory<PassCoreMethodMap>({
    id: 'PassCoreWorker',
    spawn: () =>
        new Worker(
            /* webpackChunkName: "pass-core.worker" */
            new URL('./core.worker', import.meta.url)
        ),
});
