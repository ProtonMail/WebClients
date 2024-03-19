import type { Action } from '@reduxjs/toolkit';

import { CryptoProxy } from '@proton/crypto';
import type { SharedStartListening } from '@proton/redux-shared-store/listenerInterface';
import { hasBit } from '@proton/shared/lib/helpers/bitset';
import noop from '@proton/utils/noop';

import { serverEvent } from '../eventLoop';
import { selectMembers } from '../members';
import { selectOrganization } from '../organization';
import { migrateOrganizationKeyPasswordless, migrateOrganizationKeyPasswordlessPrivateAdmin } from './actions';
import { type OrganizationKeyState, organizationKeyThunk, selectOrganizationKey } from './index';

export const organizationKeysListener = (startListening: SharedStartListening<OrganizationKeyState>) => {
    startListening({
        predicate: (action: Action, currentState: OrganizationKeyState) => {
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

    startListening({
        predicate: (action, currentState, nextState) => {
            return Boolean(
                selectOrganizationKey(nextState).value &&
                    selectMembers(nextState).value?.length &&
                    selectOrganization(nextState).value
            );
        },
        effect: async (action, listenerApi) => {
            const state = listenerApi.getState();
            const organization = selectOrganization(state).value;
            const members = selectMembers(state).value;
            const self = members?.find((member) => Boolean(member.Self));
            const organizationKey = selectOrganizationKey(state).value;
            if (!organization || !self || !organizationKey?.privateKey) {
                return;
            }
            try {
                listenerApi.unsubscribe();

                if (hasBit(organization.ToMigrate, 2)) {
                    await listenerApi.dispatch(migrateOrganizationKeyPasswordless());
                } else if (hasBit(self.ToMigrate, 2)) {
                    await listenerApi.dispatch(migrateOrganizationKeyPasswordlessPrivateAdmin());
                }
            } catch (e) {}
        },
    });
};
