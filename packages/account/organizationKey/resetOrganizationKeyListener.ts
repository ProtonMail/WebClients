import type { SharedStartListening } from '@proton/redux-shared-store-types';
import { getIsMemberPendingOrgKeyResetUnprivatization } from '@proton/shared/lib/keys/memberHelper';
import noop from '@proton/utils/noop';

import { selectMembers } from '../members';
import { type ResetOrganizationKeyState, resumeOrganizationKeyResetUnprivatization } from './resetOrganizationKey';

/**
 * Resumes an organization key reset that got interrupted after the members were converted to private but before the
 * unprivatization requests were sent, e.g. because the tab was closed. The members stay flagged by the API, so this
 * kicks in as soon as the member list is loaded again.
 */
export const resetOrganizationKeyListener = (startListening: SharedStartListening<ResetOrganizationKeyState>) => {
    startListening({
        predicate: (action, currentState, previousState) => {
            const currentMembers = selectMembers(currentState).value;
            if (!currentMembers?.length || currentMembers === selectMembers(previousState).value) {
                return false;
            }
            return currentMembers.some(getIsMemberPendingOrgKeyResetUnprivatization);
        },
        effect: async (action, listenerApi) => {
            try {
                listenerApi.unsubscribe();
                await listenerApi.dispatch(resumeOrganizationKeyResetUnprivatization()).catch(noop);
            } finally {
                listenerApi.subscribe();
            }
        },
    });
};
