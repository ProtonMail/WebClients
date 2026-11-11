import isDeepEqual from 'lodash/isEqual';

import { orderAddresses } from '@proton/account/addresses/actions';
import { useAddresses } from '@proton/account/addresses/hooks';
import { getStatus } from '@proton/components/containers/addresses/helper';
import useLoading from '@proton/hooks/useLoading';
import { useDispatch } from '@proton/redux-shared-store/sharedProvider';
import { getIsNonDefault, sortAddresses } from '@proton/shared/lib/mail/addresses';
import move from '@proton/utils/move';

/** The default address of the user, the addresses that can replace it, and how to change it */
export const useDefaultAddress = () => {
    const dispatch = useDispatch();
    const [addresses = []] = useAddresses();
    const [saving, withSaving] = useLoading(false);

    const list = sortAddresses(addresses);
    const [defaultAddress] = list;
    const options = list.filter((address) => !getIsNonDefault(address));

    const handleSetDefaultAddress = async (addressID: string) => {
        const oldIndex = list.findIndex((address) => address.ID === addressID);
        if (oldIndex === -1) {
            return;
        }

        const newIndex = 0;

        const newList = move(list, oldIndex, newIndex);
        const { isExternal, isDisabled } = getStatus(newList[0], 0);

        if (isDeepEqual(list, newList)) {
            return;
        }

        // Do not set disabled or external addresses as default
        if (newIndex === 0 && (isDisabled || isExternal)) {
            return;
        }

        await dispatch(orderAddresses({ member: undefined, addresses: newList }));
    };

    return {
        defaultAddress,
        options,
        saving,
        setDefaultAddress: (addressID: string) => withSaving(handleSetDefaultAddress(addressID)),
    };
};
