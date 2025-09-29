import { useAddresses } from '@proton/account/addresses/hooks';
import { useUser } from '@proton/account/user/hooks';

import { MAX_SYNC_FREE_USER, MAX_SYNC_PAID_USER } from '../constants';
import { getBYOEAddressesCounts } from '../helpers/byoeAddresses';
import { useEasySwitchSelector } from '../logic/store';
import { getAllSync } from '../logic/sync/sync.selectors';

const useBYOEAddressesCounts = () => {
    const [addresses] = useAddresses();
    const [user] = useUser();
    const allSyncs = useEasySwitchSelector(getAllSync);

    const { addressesOrSyncs, byoeAddresses, activeBYOEAddresses } = getBYOEAddressesCounts(addresses, allSyncs);

    return {
        byoeAddresses,
        activeBYOEAddresses,
        addressesOrSyncs,
        usedBYOEAddresses: addressesOrSyncs.length,
        maxBYOEAddresses: user.hasPaidMail ? MAX_SYNC_PAID_USER : MAX_SYNC_FREE_USER,
    };
};

export default useBYOEAddressesCounts;
