import { useAddresses } from '@proton/account/addresses/hooks';
import { ADDRESS_STATUS, ADDRESS_TYPE } from '@proton/shared/lib/constants';

const useAvailableAddresses = () => {
    const [addresses, loading] = useAddresses();

    const availableAddresses = addresses?.filter(
        (addr) =>
            addr.Receive &&
            addr.Send &&
            addr.Keys.some((k) => k.Active) &&
            addr.Status === ADDRESS_STATUS.STATUS_ENABLED &&
            addr.Type !== ADDRESS_TYPE.TYPE_EXTERNAL
    );

    return {
        availableAddresses,
        defaultAddress: availableAddresses?.[0],
        loading,
    };
};

export default useAvailableAddresses;
