import type { SharedStartListening } from '@proton/redux-shared-store-types/interface';
import noop from '@proton/utils/noop';

import { bootstrapEvent } from '../bootstrap/action';
import { type AvailableAppsState, fetchAvailableApps } from './index';

export const availableAppsListener = (startListening: SharedStartListening<AvailableAppsState>) => {
    startListening({
        actionCreator: bootstrapEvent,
        effect: (_, listenerApi) => {
            // On failure, the last list stays
            listenerApi.dispatch(fetchAvailableApps()).catch(noop);
        },
    });
};
