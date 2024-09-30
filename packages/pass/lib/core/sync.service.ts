import type { MaybeNull } from '@proton/pass/types';
import { logger } from '@proton/pass/utils/logger';

import type { PassCore, PassCoreService } from './types';

export const createPassCoreSyncService = (): PassCoreService => {
    let wasmPromise: MaybeNull<Promise<PassCore>> = null;

    const loadWASM = async () =>
        (wasmPromise = wasmPromise ?? import(/* webpackChunkName: "pass-core" */ '@protontech/pass-rust-core'));

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
