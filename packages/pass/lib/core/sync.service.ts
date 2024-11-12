import { isNativeJSError } from '@proton/pass/lib/core/utils';
import browser from '@proton/pass/lib/globals/browser';
import type { MaybeNull } from '@proton/pass/types';
import { logger } from '@proton/pass/utils/logger';

import type { PassCore, PassCoreService } from './types';

export const createPassCoreSyncService = (): PassCoreService => {
    let wasmPromise: MaybeNull<Promise<PassCore>> = null;

    const loadWASM = async () =>
        (wasmPromise =
            wasmPromise ?? import(/* webpackChunkName: "pass-core.worker" */ '@protontech/pass-rust-core/worker'))
            .then((value) => {
                logger.debug(`[PassCoreUI] Module v${value.library_version()} loaded`);
                return value;
            })
            .catch(() => {
                /** Chrome extensions may encounter internal runtime errors (ie: `ChromeMethodBFE`)
                 * during WASM instantiation. We explicitly read `browser.runtime.lastError` to
                 * prevent these errors from interfering with other extension API calls. */
                void browser.runtime?.lastError;
                throw new Error('Module not initialized');
            });

    const service: PassCoreService = {
        exec: async (method, ...args) => {
            try {
                const core = await loadWASM();
                return (core[method] as any)(...args);
            } catch (err) {
                if (isNativeJSError(err)) logger.warn(`[PassCoreWorker] Failed executing ${method}`, err);
                throw err;
            }
        },
    };

    return service;
};
