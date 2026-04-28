import { useAddresses } from '@proton/account/addresses/hooks';
import { getIsBYOEAddress } from '@proton/shared/lib/helpers/address';

export const useBYOEAddresses = () => {
    const [addresses] = useAddresses();

    return addresses?.filter((address) => getIsBYOEAddress(address)) || [];
};
