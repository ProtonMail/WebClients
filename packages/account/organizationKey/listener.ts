import { CryptoProxy } from '@proton/crypto';
import type { SharedStartListening } from '@proton/redux-shared-store-types';
import { CacheType } from '@proton/redux-utilities';
import { hasBit } from '@proton/shared/lib/helpers/bitset';
import { captureMessage } from '@proton/shared/lib/helpers/sentry';
import { getSentryError } from '@proton/shared/lib/keys';
import noop from '@proton/utils/noop';

import { addressesThunk, selectAddresses } from '../addresses';
import { coreEventLoopV6 } from '../coreEventLoop';
import { serverEvent } from '../eventLoop';
import { selectMembers } from '../members';
import { selectOrganization } from '../organization';
import {
    changeOrganizationSignature,
    getIsEligibleOrganizationIdentityAddress,
    migrateOrganizationKeyPasswordless,
    migrateOrganizationKeyPasswordlessPrivateAdmin,
} from './actions';
import { type OrganizationKeyState, organizationKeyThunk, selectOrganizationKey } from './index';

export const organizationKeysListener = (startListening: SharedStartListening<OrganizationKeyState>) => {
    startListening({
        predicate: (action, currentState) => {
            // Warning: There is no event update coming for organization key changes, however, an update for the organization
            // is received as the keys are changed. So each time it changes, it will redo this.
            return !!(
                !!selectOrganizationKey(currentState).value &&
                ((serverEvent.match(action) && action.payload.Organization) ||
                    (coreEventLoopV6.match(action) && action.payload.event.Organizations?.length))
            );
        },
        effect: async (action, listenerApi) => {
            await listenerApi.dispatch(organizationKeyThunk({ cache: CacheType.None }));
        },
    });

    startListening({
        predicate: (action, currentState, previousState) => {
            const oldValue = selectOrganization(previousState).value;
            const newValue = selectOrganization(currentState).value;
            return !!(
                !!selectOrganizationKey(currentState).value &&
                newValue?.HasKeys &&
                newValue?.HasKeys !== oldValue?.HasKeys
            );
        },
        effect: async (action, listenerApi) => {
            await listenerApi.dispatch(organizationKeyThunk({ cache: CacheType.None }));
        },
    });

    startListening({
        predicate: (action, currentState, previousState) => {
            const oldValue = selectOrganizationKey(previousState).value;
            return !!(oldValue && oldValue !== selectOrganizationKey(currentState).value);
        },
        effect: async (action, listenerApi) => {
            const oldValue = selectOrganizationKey(listenerApi.getOriginalState())?.value;
            if (oldValue?.privateKey) {
                await CryptoProxy.clearKey({ key: oldValue.privateKey }).catch(noop);
            }
        },
    });
};

export const organizationKeysManagementListener = (startListening: SharedStartListening<OrganizationKeyState>) => {
    startListening({
        predicate: (action, currentState) => {
            return Boolean(
                selectOrganizationKey(currentState).value &&
                    selectMembers(currentState).value?.length &&
                    selectOrganization(currentState).value
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

    startListening({
        predicate: (action, currentState) => {
            const organizationKey = selectOrganizationKey(currentState).value;
            const eligibleAddresses = (selectAddresses(currentState).value || []).filter(
                getIsEligibleOrganizationIdentityAddress
            );
            return Boolean(
                organizationKey?.privateKey &&
                    !organizationKey.Key.FingerprintSignature &&
                    eligibleAddresses.length >= 1
            );
        },
        effect: async (action, listenerApi) => {
            listenerApi.unsubscribe();

            const [organizationKey, addresses] = await Promise.all([
                listenerApi.dispatch(organizationKeyThunk()),
                listenerApi.dispatch(addressesThunk()),
            ]);

            const eligibleAddresses = addresses.filter(getIsEligibleOrganizationIdentityAddress);
            const primaryEligibleAddress = eligibleAddresses[0];

            if (
                Boolean(
                    organizationKey?.privateKey &&
                        !organizationKey.Key.FingerprintSignature &&
                        eligibleAddresses.length >= 1
                )
            ) {
                try {
                    await listenerApi.dispatch(changeOrganizationSignature({ address: primaryEligibleAddress }));
                } catch (e) {
                    const error = getSentryError(e);
                    if (error) {
                        captureMessage('Organization identity: Error generating signature', {
                            level: 'error',
                            extra: { error },
                        });
                    }
                }
            }
        },
    });
};
