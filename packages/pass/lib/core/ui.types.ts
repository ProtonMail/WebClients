import type * as PassUIWorker from '@protontech/pass-rust-core/ui';

export type PassUI = typeof PassUIWorker;
export type PassUIMethod = keyof { [K in keyof PassUI]: PassUI[K] extends Function ? K : never };
export type PassUIParams<T extends PassUIMethod> = Parameters<PassUI[T]>;
export type PassUIResult<T extends PassUIMethod> = ReturnType<PassUI[T]>;
export type PassUIRPC<T extends PassUIMethod> = { method: T; args: PassUIParams<T> };
export type PassUIProxy = { [K in PassUIMethod]: (...params: PassUIParams<K>) => Promise<PassUIResult<K>> };

export interface PassUIService {
    exec: <T extends PassUIMethod>(method: T, ...params: PassUIParams<T>) => Promise<PassUIResult<T>>;
    transfer: (
        transferable: Transferable[]
    ) => <T extends PassUIMethod>(method: T, ...params: PassUIParams<T>) => Promise<PassUIResult<T>>;
}
