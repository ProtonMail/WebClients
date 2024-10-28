import browser from '@proton/pass/lib/globals/browser';
import type { MaybeNull } from '@proton/pass/types';
import { logger } from '@proton/pass/utils/logger';

import type { PassCore, PassCoreService } from './types';

export const createPassCoreSyncService = (): PassCoreService => {
    let wasmPromise: MaybeNull<Promise<PassCore>> = null;

    const loadWASM = async () =>
        (wasmPromise = wasmPromise ?? import(/* webpackChunkName: "pass-core" */ '@protontech/pass-rust-core')).catch(
            (error) => {
                /** Chrome extensions may encounter internal runtime errors (ie: `ChromeMethodBFE`)
                 * during WASM instantiation. We explicitly read `browser.runtime.lastError` to
                 * prevent these errors from interfering with other extension API calls. */
                void browser.runtime?.lastError;
                throw error;
            }
        );

    const service: PassCoreService = {
        exec: async (method, ...args) => {
            try {
                const core = await loadWASM();
                return (core[method] as any)(...args);
            } catch (err) {
                logger.warn(`[PassCore] Failed executing ${method}`, err);
                throw new Error('PassCore not initialized');
            }
        },
    };

    return service;
};
