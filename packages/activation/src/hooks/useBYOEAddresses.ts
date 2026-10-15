import { useAddresses } from '@proton/account/addresses/hooks';
import { getIsBYOEAddress } from '@proton/shared/lib/helpers/address';

export const useBYOEAddresses = () => {
    const [addresses, loading] = useAddresses();

    return {
        addresses: addresses?.filter((address) => getIsBYOEAddress(address)) || [],
        loading,
    };
};
