import type { SharedStartListening } from '@proton/redux-shared-store-types';

import type { GroupsState } from '../index';
import { generateGroupKeysIfNeeded, groupsToGenerateFilter } from './generateGroupKeys';

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
