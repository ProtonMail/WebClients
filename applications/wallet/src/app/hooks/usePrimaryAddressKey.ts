import { useMemo } from 'react';

import { useAddressesKeys } from '@proton/components/hooks';

export const usePrimaryAddressKey = () => {
    const [addresses] = useAddressesKeys();

    const primaryAddress = useMemo(() => {
        const primaryAddressId = addresses?.at(0)?.address.ID;
        const primaryAddressKey = addresses?.at(0)?.keys.at(0);

        if (primaryAddressId && primaryAddressKey) {
            return {
                ID: primaryAddressId,
                key: primaryAddressKey,
            };
        }
    }, [addresses]);

    return primaryAddress;
};
