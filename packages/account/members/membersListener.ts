import type { SharedStartListening } from '@proton/redux-shared-store-types';

import { selectUser } from '../user';
import { selectUserPermissions } from '../userPermissions';
import { type MembersState, canFetchMembers, membersActions, selectMembers } from './index';

export const membersListener = (startListening: SharedStartListening<MembersState>) => {
    startListening({
        predicate: (action, currentState, previousState) => {
            // A role change flips legacy admin status; a permissions-model change flips role-based
            // access. Ignore every other user model update to avoid re-running the permission check
            // on unrelated changes.
            return (
                selectUser(currentState).value?.Role !== selectUser(previousState).value?.Role ||
                selectUserPermissions(currentState).value !== selectUserPermissions(previousState).value
            );
        },
        effect: async (action, listenerApi) => {
            // Cancel any in-flight run so a slower, stale permission check can't overwrite the result
            // of a more recent role/permission change.
            listenerApi.cancelActiveListeners();
            // Nothing cached to reconcile yet — the next read will apply the permission check itself.
            if (!selectMembers(listenerApi.getState()).value) {
                return;
            }
            const canFetch = await canFetchMembers(listenerApi.dispatch);
            if (listenerApi.signal.aborted) {
                return;
            }
            listenerApi.dispatch(membersActions.handlePermissionChange({ canFetch }));
        },
    });
};
