import { logger } from '@proton/pass/utils/logger';

import { SyncStrategy } from './types';

/** Keeping a global reference to avoid coupling every function
 * requiring this stateful value to avoid reading it from the
 * redux state or having to drill-down the value. */
export let SYNC_STRATEGY: SyncStrategy = SyncStrategy.LEGACY;

export const setSyncStrategy = (strategy: SyncStrategy) => {
    if (SYNC_STRATEGY !== strategy) {
        logger.info(`[SyncStrategy] strategy set to ${strategy}`);
        SYNC_STRATEGY = strategy;
    }
};
