import type * as PassRustWorker from '@protontech/pass-rust-core/worker';

export type PassCore = typeof PassRustWorker;
export type PassCoreMethod = keyof { [K in keyof PassCore]: PassCore[K] extends Function ? K : never };
export type PassCoreParams<T extends PassCoreMethod> = Parameters<PassCore[T]>;
export type PassCoreResult<T extends PassCoreMethod> = ReturnType<PassCore[T]>;
export type PassCoreRPC<T extends PassCoreMethod> = { method: T; args: PassCoreParams<T> };
export type PassCoreProxy = { [K in PassCoreMethod]: (...params: PassCoreParams<K>) => Promise<PassCoreResult<K>> };

export interface PassCoreService {
    exec: <T extends PassCoreMethod>(method: T, ...params: PassCoreParams<T>) => Promise<PassCoreResult<T>>;
}
