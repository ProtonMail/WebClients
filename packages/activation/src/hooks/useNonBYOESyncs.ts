import { useAddresses } from '@proton/account/addresses/hooks';
import { useEasySwitchSelector } from '@proton/activation/src/logic/store';
import { getAllSync } from '@proton/activation/src/logic/sync/sync.selectors';
import { getIsBYOEAddress } from '@proton/shared/lib/helpers/address';

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
