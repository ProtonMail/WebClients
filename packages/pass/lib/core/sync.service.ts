import { logger } from '@proton/pass/utils/logger';

import type { PassCore, PassCoreService } from './types';

let bindings: PassCore;

/**  */
export const createPassCoreSyncService = (): PassCoreService => {
    const service: PassCoreService = { exec: (method, ...args) => (bindings[method] as any)(...args) };

    import('@protontech/pass-rust-core')
        .then((module) => (bindings = module))
        .catch(() => logger.error('Failed loading wasm module'));

    return service;
};
