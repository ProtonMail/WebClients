import { useAddresses } from '@proton/account/addresses/hooks';
import { useEntitlementChecksForOrgAndUser } from '@proton/account/entitlementCatalog/hooks';
import { useUser } from '@proton/account/user/hooks';
import { useLoading } from '@proton/hooks';
import { useDispatch } from '@proton/redux-shared-store/sharedProvider';
import { getIsBYOEOnlyAccount } from '@proton/shared/lib/helpers/address';
import type { Address } from '@proton/shared/lib/interfaces';
import { isAdmin } from '@proton/shared/lib/user/helpers';
import { tracker } from '@proton/telemetry-tracker/tracker';

import { useEasySwitchDispatch } from '../logic/store';
import { loadSyncList } from '../logic/sync/sync.actions';
import { BYOEAddressAction } from '../telemetry/events';
import { updateBYOEAddressConnection } from '../thunks/updateBYOEAddressConnection';

export const useDisconnectBYOEAddress = (address: Address) => {
    const [loading, withLoading] = useLoading(false);
    const dispatch = useDispatch();
    const easySwitchDispatch = useEasySwitchDispatch();
    const [user] = useUser();
    const [entitlements, loadingEntitlements] = useEntitlementChecksForOrgAndUser();
    const [addresses] = useAddresses();

    // The disable request needs the organisation scope, which non-admin members of an organisation
    // don't have. It's also impossible to disable your only address. In both cases the disconnect
    // runs without the disable step.
    const isBYOEOnlyAccount = getIsBYOEOnlyAccount(addresses);
    const isOrganisationMember = entitlements.isMultiUser && !isAdmin(user);
    const skipDisable = isBYOEOnlyAccount || isOrganisationMember;

    const disconnect = () => {
        // skipDisable depends on the entitlements: running before they load could send a request the user has no scope for
        if (loadingEntitlements) {
            return Promise.reject(new Error('Cannot disconnect before the entitlements are loaded'));
        }

        return withLoading(async () => {
            await dispatch(updateBYOEAddressConnection({ address, type: 'disconnect', skipDisable }));
            // also update the syncs list
            void easySwitchDispatch(loadSyncList());

            tracker.emit(BYOEAddressAction, {
                dimensions: {
                    addressAction: 'disconnect',
                    provider: 'google',
                },
            });
        });
    };

    return { disconnect, loading: loading || loadingEntitlements, isDisconnecting: loading, skipDisable };
};
