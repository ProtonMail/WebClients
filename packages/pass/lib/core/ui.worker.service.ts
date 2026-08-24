import type { PassUIMethod, PassUIParams, PassUIResult } from './ui.types';
import { wasmWorkerServiceFactory } from './wasm.worker.service';

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
            new URL('./ui.worker', import.meta.url)
        ),
});
