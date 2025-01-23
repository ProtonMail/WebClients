import type { SharedStartListening } from '@proton/redux-shared-store-types';
import noop from '@proton/utils/noop';

import type { AddressesState } from '../addresses';
import { bootstrapEvent } from '../bootstrap/action';
import { runKeyBackgroundManager } from './keyBackgroundActions';

export const keyBackgroundManagerListener = (startListening: SharedStartListening<AddressesState>) => {
    startListening({
        predicate: (action) => {
            return bootstrapEvent.match(action);
        },
        effect: async (_, listenerApi) => {
            listenerApi.unsubscribe();
            listenerApi.dispatch(runKeyBackgroundManager()).catch(noop);
        },
    });
};
