import { ADDRESS_FLAGS } from '@proton/shared/lib/constants';
import { getIsBYOEAddress } from '@proton/shared/lib/helpers/address';
import { hasBit } from '@proton/shared/lib/helpers/bitset';
import type { Address } from '@proton/shared/lib/interfaces/Address';

import type { Sync } from '../logic/sync/sync.interface';

export const getBYOEAddressesCounts = (addresses: Address[] | undefined, syncs: Sync[]) => {
    const byoeAddresses = addresses?.filter((address) => getIsBYOEAddress(address)) || [];

    const activeBYOEAddresses = byoeAddresses?.filter(
        (address) =>
            !(
                hasBit(address.Flags, ADDRESS_FLAGS.FLAG_DISABLE_E2EE) &&
                hasBit(address.Flags, ADDRESS_FLAGS.FLAG_DISABLE_EXPECTED_SIGNED)
            )
    );

    const addressesOrSyncs = activeBYOEAddresses.length > syncs.length ? activeBYOEAddresses : syncs;

    return {
        byoeAddresses,
        activeBYOEAddresses,
        addressesOrSyncs,
    };
};
