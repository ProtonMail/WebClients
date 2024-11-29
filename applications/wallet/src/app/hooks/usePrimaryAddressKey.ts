import { useMemo } from 'react';

import { useAddressesKeys } from '@proton/account/addressKeys/hooks';

export const usePrimaryAddressKey = () => {
    const [addresses] = useAddressesKeys();

    const primaryAddress = useMemo(() => {
        const primaryAddress = addresses?.at(0)?.address;
        const primaryAddressKey = addresses?.at(0)?.keys.at(0);

        if (primaryAddress && primaryAddressKey) {
            return {
                ID: primaryAddress.ID,
                email: primaryAddress.Email,
                key: primaryAddressKey,
            };
        }
    }, [addresses]);

    return primaryAddress;
};
