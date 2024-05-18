import type { PassCoreProxy, PassCoreService } from './types';

/** The PassCoreService class provides an `exec` function that abstracts
 * the execution of PassRustCore methods, regardless of whether the
 * WASM module is loaded in a worker or within the same execution context.
 * The PassCoreProxy enables duck-typing of the initial PassRustCore methods
 * through a proxy object, thereby offering a more user-friendly API. */
export const createPassCoreProxy = (service: PassCoreService): PassCoreProxy =>
    new Proxy<PassCoreProxy>({} as any, {
        get(_, property) {
            return (...args: any[]) => service.exec(property as any, ...args);
        },
    });
