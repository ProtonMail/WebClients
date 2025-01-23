import type { SharedStartListening } from '@proton/redux-shared-store-types';
import noop from '@proton/utils/noop';

import { type DomainsState, selectDomains } from '../domains';
import type { KtState } from '../kt';
import type { MembersState } from '../members';
import { convertMemberExternalAddresses } from '../organizationKey/convertAddresses';
import type { OrganizationKeyState } from '../organizationKey/index';
import type { UserKeysState } from '../userKeys';

export const convertAddressesListener = (
    startListening: SharedStartListening<KtState & OrganizationKeyState & MembersState & DomainsState & UserKeysState>
) => {
    startListening({
        predicate: (action, currentState, previousState) => {
            const currentDomains = selectDomains(currentState).value || [];
            const previousDomains = selectDomains(previousState).value;
            return currentDomains.length > 0 && currentDomains !== previousDomains;
        },
        effect: async (action, listenerApi) => {
            try {
                listenerApi.unsubscribe();
                const state = listenerApi.getState();
                const domains = selectDomains(state).value || [];
                await listenerApi.dispatch(convertMemberExternalAddresses({ domains })).catch(noop);
            } finally {
                listenerApi.subscribe();
            }
        },
    });
};
