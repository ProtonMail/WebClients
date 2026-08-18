import { useAddresses } from '@proton/account/addresses/hooks';
import { getIsBYOEAddress } from '@proton/shared/lib/helpers/address';

import { useEasySwitchSelector } from '../logic/store';
import { getAllSync } from '../logic/sync/sync.selectors';

export const useNonBYOESyncs = () => {
    const [addresses = []] = useAddresses();
    const allSyncs = useEasySwitchSelector(getAllSync);

    return allSyncs
        .filter((sync) => {
            const address = addresses.find((a) => a.Email === sync.account);
            return address ? !getIsBYOEAddress(address) : true;
        })
        .sort((a, b) => b.startDate - a.startDate)
        .map((sync) => sync.id);
};
