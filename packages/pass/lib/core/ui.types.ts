import type * as PassUIWorker from '@protontech/pass-rust-core/ui';

import type { WasmWorkerService } from '@proton/pass/lib/core/wasm.worker.service';
import type { Callback, ExtractKeysOfType, Result } from '@proton/pass/types';

type PassUIModule = typeof PassUIWorker;

export type PassUI = Pick<PassUIModule, ExtractKeysOfType<PassUIModule, Callback>>;
export type PassUIMethod = keyof PassUI;
export type PassUIParams<T extends PassUIMethod> = Parameters<PassUI[T]>;
export type PassUIResult<T extends PassUIMethod> = ReturnType<PassUI[T]>;
export type PassUIMessageEvent<T extends PassUIMethod> = Result<{ value: PassUIResult<T> }>;
export type PassUIRPC<T extends PassUIMethod> = { method: T; args: PassUIParams<T> };
export type PassUIProxy = { [K in PassUIMethod]: (...params: PassUIParams<K>) => Promise<PassUIResult<K>> };

export type PassUIMethodMap = {
    [K in PassUIMethod]: {
        args: PassUIParams<K>;
        return: PassUIResult<K>;
    };
};

export type PassUIWorkerService = WasmWorkerService<PassUIMethodMap>;
export type PassUIService = Pick<PassUIWorkerService, 'exec'>;
