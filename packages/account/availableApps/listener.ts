import type { SharedStartListening } from '@proton/redux-shared-store-types/interface';
import noop from '@proton/utils/noop';

import { bootstrapEvent } from '../bootstrap/action';
import { selectOrganization } from '../organization';
import { type AvailableAppsState, fetchAvailableApps } from './index';

export const availableAppsListener = (startListening: SharedStartListening<AvailableAppsState>) => {
    startListening({
        actionCreator: bootstrapEvent,
        effect: (_, listenerApi) => {
            // On failure, the last list stays
            listenerApi.dispatch(fetchAvailableApps()).catch(noop);
        },
    });

    // shortcut: recomputes the list when the organization changes, e.g. when the background refresh of a persisted copy
    // brings new allowed products, or from an event. Remove once the list comes from the API.
    startListening({
        predicate: (_, currentState, previousState) =>
            selectOrganization(currentState).value !== selectOrganization(previousState).value,
        effect: (_, listenerApi) => {
            listenerApi.dispatch(fetchAvailableApps()).catch(noop);
        },
    });
};
