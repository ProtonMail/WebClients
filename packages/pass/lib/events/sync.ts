import { SYNC_VERSION } from '@proton/pass/constants';
import { syncV1 } from '@proton/pass/lib/events/v1/sync';
import { syncV2 } from '@proton/pass/lib/events/v2/user-events.sync';
import type { RootSagaOptions, State } from '@proton/pass/store/types';
import type { MaybeNull } from '@proton/pass/types';

export const sync = (state: MaybeNull<State>, options: RootSagaOptions) => {
    if (!state) throw new Error('Invalid state');

    switch (SYNC_VERSION) {
        case 1:
            return syncV1(options);
        case 2:
            return syncV2(state);
    }
};
