import type { SharedStartListening } from '@proton/redux-shared-store-types';
import noop from '@proton/utils/noop';

import type { DomainsState } from '../domains';
import type { KtState } from '../kt';
import { type MembersState, selectMembers } from '../members';
import { type OrganizationKeyState, organizationKeyThunk } from '../organizationKey';
import type { UserKeysState } from '../userKeys';
import { unprivatizeMembersAutomatic } from './unprivatizeMembers';

export const unprivatizeMembersListener = (
    startListening: SharedStartListening<KtState & OrganizationKeyState & MembersState & DomainsState & UserKeysState>
) => {
    startListening({
        predicate: (action, currentState, previousState) => {
            const currentMembers = selectMembers(currentState).value || [];
            const previousMembers = selectMembers(previousState).value;
            return currentMembers.length > 0 && currentMembers !== previousMembers;
        },
        effect: async (action, listenerApi) => {
            try {
                listenerApi.unsubscribe();
                const state = listenerApi.getState();
                const members = selectMembers(state).value || [];
                const organizationKey = await listenerApi.dispatch(organizationKeyThunk());
                if (!organizationKey.privateKey) {
                    // user does not have org key
                    return;
                }
                await listenerApi
                    .dispatch(
                        unprivatizeMembersAutomatic({
                            target: {
                                type: 'background',
                                members,
                            },
                        })
                    )
                    .catch(noop);
            } finally {
                listenerApi.subscribe();
            }
        },
    });
};
