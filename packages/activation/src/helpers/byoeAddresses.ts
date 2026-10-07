import { ADDRESS_FLAGS, ADDRESS_STATUS } from '@proton/shared/lib/constants';
import { getIsBYOEAddress } from '@proton/shared/lib/helpers/address';
import { hasBit } from '@proton/shared/lib/helpers/bitset';
import type { Address } from '@proton/shared/lib/interfaces/Address';
import type { User } from '@proton/shared/lib/interfaces/User';
import { hasPaidMail } from '@proton/shared/lib/user/helpers';

import { MAX_SYNC_FREE_USER, MAX_SYNC_PAID_USER } from '../constants';
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

    const addressesOrSyncs = activeBYOEAddresses.length > syncs.length ? activeBYOEAddresses : syncs;

    return {
        byoeAddresses,
        activeBYOEAddresses,
        addressesOrSyncs,
    };
};

export type BYOEAddressLimit = 'free-limit' | 'paid-limit';

/** Returns which limit the user reached on the number of active BYOE addresses, if any. */
export const getBYOEAddressLimit = (user: User, activeBYOEAddressesCount: number): BYOEAddressLimit | undefined => {
    if (!hasPaidMail(user) && activeBYOEAddressesCount >= MAX_SYNC_FREE_USER) {
        return 'free-limit';
    }
    if (activeBYOEAddressesCount >= MAX_SYNC_PAID_USER) {
        return 'paid-limit';
    }
    return undefined;
};
