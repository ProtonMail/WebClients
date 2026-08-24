import { logger } from '../../utils/logger';
import { SyncStrategy } from './types';

export const DEFAULT_SYNC_STRATEGY = SyncStrategy.LEGACY;

/** Keeping a global reference to avoid coupling every function
 * requiring this stateful value to avoid reading it from the
 * redux state or having to drill-down the value. */
export let SYNC_STRATEGY: SyncStrategy = DEFAULT_SYNC_STRATEGY;

export const setSyncStrategy = (strategy: SyncStrategy = DEFAULT_SYNC_STRATEGY) => {
    if (SYNC_STRATEGY !== strategy) {
        logger.info(`[SyncStrategy] strategy set to ${strategy}`);
        SYNC_STRATEGY = strategy;
    }
};
