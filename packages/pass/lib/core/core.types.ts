import type * as PassRustWorker from '@protontech/pass-rust-core/worker';

import type { WasmWorkerService } from '@proton/pass/lib/core/wasm.worker.service';
import type { Result } from '@proton/pass/types';

export type PassCore = typeof PassRustWorker;
export type PassCoreMethod = keyof { [K in keyof PassCore]: PassCore[K] extends Function ? K : never };
export type PassCoreParams<T extends PassCoreMethod> = Parameters<PassCore[T]>;
export type PassCoreResult<T extends PassCoreMethod> = ReturnType<PassCore[T]>;
export type PassCoreMessageEvent<T extends PassCoreMethod> = Result<{ value: PassCoreResult<T> }>;
export type PassCoreRPC<T extends PassCoreMethod> = { method: T; args: PassCoreParams<T> };
export type PassCoreProxy = {
    [K in PassCoreMethod]: (...params: PassCoreParams<K>) => Promise<Awaited<PassCoreResult<K>>>;
};

export type PassCoreMethodMap = {
    [K in PassCoreMethod]: {
        args: PassCoreParams<K>;
        return: PassCoreResult<K>;
    };
};

export type PassCoreWorkerService = WasmWorkerService<PassCoreMethodMap>;
export type PassCoreService = Pick<PassCoreWorkerService, 'exec'>;
