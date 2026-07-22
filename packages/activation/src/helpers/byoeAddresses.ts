import { ADDRESS_FLAGS, ADDRESS_STATUS } from '@proton/shared/lib/constants';
import { getIsBYOEAddress } from '@proton/shared/lib/helpers/address';
import { hasBit } from '@proton/shared/lib/helpers/bitset';
import { canonicalizeEmail } from '@proton/shared/lib/helpers/email';
import type { Address } from '@proton/shared/lib/interfaces/Address';

import type { Sync } from '../logic/sync/sync.interface';

const getIsActiveBYOEAddress = (address: Address) => {
    if (address.Status === ADDRESS_STATUS.STATUS_DISABLED) {
        return false;
    }
    return !(
        hasBit(address.Flags, ADDRESS_FLAGS.FLAG_DISABLE_E2EE) &&
        hasBit(address.Flags, ADDRESS_FLAGS.FLAG_DISABLE_EXPECTED_SIGNED)
    );
};

export const getBYOEAddressesCounts = (addresses: Address[] | undefined, syncs: Sync[]) => {
    const byoeAddresses = addresses?.filter((address) => getIsBYOEAddress(address)) || [];
    const activeBYOEAddresses = byoeAddresses.filter(getIsActiveBYOEAddress);

    // A BYOE address and its forwarding sync are created together. Right now, disconnecting removes the sync on
    // the backend. However, disabling does not. So we need a temporary filter to remove syncs connected to
    // disabled accounts. The backend will eventually fix this case and we can remove this.
    const inactiveBYOEEmails = new Set(
        byoeAddresses
            .filter((address) => !getIsActiveBYOEAddress(address))
            .map((address) => canonicalizeEmail(address.Email))
    );
    const activeSyncs = syncs.filter((sync) => !inactiveBYOEEmails.has(canonicalizeEmail(sync.account)));

    const addressesOrSyncs = activeBYOEAddresses.length > activeSyncs.length ? activeBYOEAddresses : activeSyncs;

    return {
        byoeAddresses,
        activeBYOEAddresses,
        addressesOrSyncs,
    };
};
