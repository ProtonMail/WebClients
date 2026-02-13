import { selectSyncStrategy } from '@proton/pass/store/selectors';
import type { RootSagaOptions, State } from '@proton/pass/store/types';
import type { MaybeNull } from '@proton/pass/types';
import { logger } from '@proton/pass/utils/logger';

import { SyncStrategy } from './types';
import { syncV1 } from './v1/sync';
import { syncV2 } from './v2/user-events.sync';

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

export const sync = (state: MaybeNull<State>, options: RootSagaOptions) => {
    if (!state) throw new Error('Invalid state');
    const strategy = selectSyncStrategy(state);

    switch (strategy) {
        case SyncStrategy.LEGACY:
            return syncV1(options);
        case SyncStrategy.USER_EVENTS:
            return syncV2(state);
    }
};
