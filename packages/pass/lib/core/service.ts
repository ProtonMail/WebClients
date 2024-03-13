import type * as Bindings from '@protontech/pass-rust-core';

import type { MaybeNull } from '@proton/pass/types';
import { logger } from '@proton/pass/utils/logger';

export type PassRustCore = typeof Bindings;

export type PassCoreService = {
    bindings: MaybeNull<PassRustCore>;
    ready: boolean;
};

export const createPassCoreService = (): PassCoreService => {
    const service: PassCoreService = { bindings: null, ready: false };

    import('@protontech/pass-rust-core')
        .then((module) => (service.bindings = module))
        .catch(() => logger.error('Failed loading wasm module'))
        .finally(() => (service.ready = true));

    return service;
};
