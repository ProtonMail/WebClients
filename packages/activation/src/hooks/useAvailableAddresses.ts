import { useAddresses } from '@proton/components/hooks';
import { ADDRESS_STATUS } from '@proton/shared/lib/constants';

const useAvailableAddresses = () => {
    const [addresses, loading] = useAddresses();

    const availableAddresses = addresses.filter(
        (addr) =>
            addr.Receive &&
            addr.Send &&
            addr.Keys.some((k) => k.Active) &&
            addr.Status === ADDRESS_STATUS.STATUS_ENABLED
    );

    return {
        availableAddresses,
        defaultAddress: addresses[0],
        loading,
    };
};

export default useAvailableAddresses;
