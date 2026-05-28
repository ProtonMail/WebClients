import { generateGroupKeysIfNeeded, groupsToGenerateFilter } from '@proton/account/groups/generateGroupKeys';
import type { SharedStartListening } from '@proton/redux-shared-store-types';
import { getUnleashReadyPromise } from '@proton/unleash/getUnleashReadyPromise';
import noop from '@proton/utils/noop';

import type { GroupsState } from '../index';

export const groupKeysListener = (startListening: SharedStartListening<GroupsState>) => {
    startListening({
        predicate: (_action, currentState, previousState) => {
            // Fire when either groups or organizationKey transition to a new value,
            // since either one arriving last completes the prerequisites.
            const groupsChanged = currentState.groups.value !== previousState.groups.value;
            const organizationKeyChanged = currentState.organizationKey.value !== previousState.organizationKey.value;
            if (!groupsChanged && !organizationKeyChanged) {
                return false;
            }
            if (!currentState.groups.value?.length || !currentState.organizationKey.value?.privateKey) {
                return false;
            }
            return currentState.groups.value.some(groupsToGenerateFilter);
        },
        effect: async (_action, listenerApi) => {
            // Unsubscribe to prevent race conditions.
            listenerApi.unsubscribe();
            await getUnleashReadyPromise(listenerApi.extra.unleashClient).catch(noop);
            // In case the flag is not enabled, just unsubscribe the listener and don't try again until next reload.
            if (!listenerApi.extra.unleashClient.isEnabled('SystemGroupFlag')) {
                return;
            }
            try {
                await listenerApi.dispatch(generateGroupKeysIfNeeded());
            } catch {
                // Ignore errors.
            } finally {
                // Resubscribe once finished.
                listenerApi.subscribe();
            }
        },
    });
};
