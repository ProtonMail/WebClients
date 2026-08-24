import { selectSyncStrategy } from '../../store/selectors';
import type { RootSagaOptions, State } from '../../store/types';
import type { MaybeNull } from '../../types';
import { SyncStrategy } from './types';
import { syncV1 } from './v1/sync';
import { syncV2 } from './v2/user-events.sync';

export const sync = (state: MaybeNull<State>, options: RootSagaOptions) => {
    if (!state) throw new Error('Invalid state');
    const strategy = selectSyncStrategy(state);

    switch (strategy) {
        case SyncStrategy.LEGACY:
            return syncV1(options);
        case SyncStrategy.USER_EVENTS:
            return syncV2(state, options);
    }
};
