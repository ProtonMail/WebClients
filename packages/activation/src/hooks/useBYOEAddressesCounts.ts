import { useAddresses } from '@proton/account/addresses/hooks';
import { useUser } from '@proton/account/user/hooks';
import { hasPaidMail } from '@proton/shared/lib/user/helpers';

import { MAX_SYNC_FREE_USER, MAX_SYNC_PAID_USER } from '../constants';
import { getBYOEAddressesCounts } from '../helpers/byoeAddresses';
import { useEasySwitchSelector } from '../logic/store';
import { getAllSync, selectSyncListLoadingState } from '../logic/sync/sync.selectors';

const useBYOEAddressesCounts = () => {
    const [addresses, loadingAddresses] = useAddresses();
    const [user, loadingUser] = useUser();
    const allSyncs = useEasySwitchSelector(getAllSync);
    const syncListLoadingState = useEasySwitchSelector(selectSyncListLoadingState);

    const { addressesOrSyncs, byoeAddresses, activeBYOEAddresses } = getBYOEAddressesCounts(addresses, allSyncs);

    const forwardingList = allSyncs.filter((sync) => {
        // Only "gmail.com" and "googlemail.com" addresses can be converted to a BYOE address so that we do not clash
        // with OLES (Organization Level Easy Switch) when having a custom domain.
        const canBeConvertedToBYOE = sync.account.endsWith('gmail.com') || sync.account.endsWith('googlemail.com');
        return !byoeAddresses.map((address) => address.Email).includes(sync.account) && canBeConvertedToBYOE;
    });

    return {
        isLoadingAddressesCount: loadingAddresses || loadingUser || syncListLoadingState !== 'success',
        byoeAddresses,
        activeBYOEAddresses,
        addressesOrSyncs,
        forwardingList,
        byoeAddressesAvailableCount: hasPaidMail(user)
            ? MAX_SYNC_PAID_USER - activeBYOEAddresses.length
            : MAX_SYNC_FREE_USER - activeBYOEAddresses.length,
        maxBYOEAddresses: hasPaidMail(user) ? MAX_SYNC_PAID_USER : MAX_SYNC_FREE_USER,
    };
};

export default useBYOEAddressesCounts;
