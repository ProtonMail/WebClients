import { AnyAction } from 'redux';

import { CryptoProxy } from '@proton/crypto';
import type { SharedStartListening } from '@proton/redux-shared-store/listenerInterface';
import noop from '@proton/utils/noop';

import { serverEvent } from '../eventLoop';
import { OrganizationKeyState, organizationKeyThunk, selectOrganizationKey } from './index';

export const organizationKeysListener = (startListening: SharedStartListening<OrganizationKeyState>) => {
    startListening({
        predicate: (action: AnyAction, currentState: OrganizationKeyState) => {
            // Warning: There is no event update coming for organization key changes, however, an update for the organization
            // is received as the keys are changed. So each time it changes, it will redo this.
            return !!(
                serverEvent.match(action) &&
                action.payload.Organization &&
                !!selectOrganizationKey(currentState).value
            );
        },
        effect: async (action, listenerApi) => {
            await listenerApi.dispatch(
                organizationKeyThunk({
                    forceFetch: true,
                })
            );
        },
    });

    startListening({
        predicate: (action, currentState, nextState) => {
            const oldValue = selectOrganizationKey(currentState).value;
            return !!(oldValue && oldValue !== selectOrganizationKey(nextState).value);
        },
        effect: async (action, listenerApi) => {
            const oldValue = selectOrganizationKey(listenerApi.getOriginalState())?.value;
            if (oldValue?.privateKey) {
                await CryptoProxy.clearKey({ key: oldValue.privateKey }).catch(noop);
            }
        },
    });
};
