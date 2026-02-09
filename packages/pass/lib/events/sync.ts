import { SYNC_VERSION } from '@proton/pass/constants';
import { syncV1 } from '@proton/pass/lib/events/v1/sync';
import { syncV2 } from '@proton/pass/lib/events/v2/user-events.sync';
import type { RootSagaOptions } from '@proton/pass/store/types';

export const sync = (options: RootSagaOptions) => {
    switch (SYNC_VERSION) {
        case 1:
            return syncV1(options);
        case 2:
            return syncV2();
    }
};
