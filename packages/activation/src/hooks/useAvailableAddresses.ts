import { useAddresses } from '@proton/account/addresses/hooks';
import { ADDRESS_STATUS, ADDRESS_TYPE } from '@proton/shared/lib/constants';
import { getIsBYOEAddress } from '@proton/shared/lib/helpers/address';

const useAvailableAddresses = () => {
    const [addresses, loading] = useAddresses();

    const availableAddresses = addresses?.filter(
        (addr) =>
            addr.Receive &&
            addr.Send &&
            addr.Keys.some((k) => k.Active) &&
            addr.Status === ADDRESS_STATUS.STATUS_ENABLED &&
            (addr.Type !== ADDRESS_TYPE.TYPE_EXTERNAL || getIsBYOEAddress(addr))
    );

    return {
        availableAddresses,
        defaultAddress: availableAddresses?.[0],
        loading,
    };
};

export default useAvailableAddresses;
