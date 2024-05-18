import { logger } from '@proton/pass/utils/logger';

import type { PassCore, PassCoreService } from './types';

let core: PassCore;

export const createPassCoreSyncService = (): PassCoreService => {
    const service: PassCoreService = {
        exec: (method, ...args) => {
            if (!core) throw new Error('PassCore not initialized');
            return (core[method] as any)(...args);
        },
    };

    import('@protontech/pass-rust-core')
        .then((module) => (core = module))
        .catch(() => logger.error('Failed loading PassCore'));

    return service;
};
