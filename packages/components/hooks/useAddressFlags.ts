import { useCallback } from 'react';

import { c } from 'ttag';

import { setAddressFlags } from '@proton/account/addressKeys/actions';
import { useDispatch } from '@proton/redux-shared-store/sharedProvider';
import { getAddressFlagsData } from '@proton/shared/lib/helpers/address';
import type { Address } from '@proton/shared/lib/interfaces';

import useErrorHandler from './useErrorHandler';
import useNotifications from './useNotifications';

interface ReturnValue {
    data: ReturnType<typeof getAddressFlagsData>;
    handleSetAddressFlags: (options: {
        encryptionDisabled: boolean;
        expectSignatureDisabled: boolean;
    }) => Promise<void>;
}

export type UseAddressFlags = (address?: Address) => ReturnValue;

const useAddressFlags: UseAddressFlags = (initialAddress) => {
    const dispatch = useDispatch();
    const handleError = useErrorHandler();
    const { createNotification } = useNotifications();

    const handleSetAddressFlags: ReturnValue['handleSetAddressFlags'] = useCallback(
        async ({ encryptionDisabled, expectSignatureDisabled }) => {
            try {
                if (!initialAddress?.ID) {
                    throw new Error('Missing address');
                }
                await dispatch(
                    setAddressFlags({ encryptionDisabled, expectSignatureDisabled, address: initialAddress })
                );
                createNotification({ text: c('Success notification').t`Preference updated` });
            } catch (e) {
                handleError(e);
            }
        },
        [initialAddress?.ID]
    );

    return {
        data: getAddressFlagsData(initialAddress),
        handleSetAddressFlags,
    };
};

export default useAddressFlags;
