import { useCallback } from 'react';

import { c } from 'ttag';

import { useGetAddressKeys } from '@proton/account/addressKeys/hooks';
import { useGetAddresses } from '@proton/account/addresses/hooks';
import useKTVerifier from '@proton/components/containers/keyTransparency/useKTVerifier';
import useEventManager from '@proton/components/hooks/useEventManager';
import useNotifications from '@proton/components/hooks/useNotifications';
import { encryptionDisabled, expectSignatureDisabled } from '@proton/shared/lib/helpers/address';
import type { Address } from '@proton/shared/lib/interfaces';

import { setAddressFlags } from './helpers/addressFlagsHelper';
import useApi from './useApi';

interface ReturnValue {
    allowDisablingEncryption: boolean;
    encryptionDisabled: boolean;
    expectSignatureDisabled: boolean;
    handleSetAddressFlags: (options: {
        encryptionDisabled: boolean;
        expectSignatureDisabled: boolean;
        notify?: boolean;
    }) => Promise<void>;
}

export type UseAddressFlags = (address?: Address) => ReturnValue;

const useAddressFlags: UseAddressFlags = (initialAddress) => {
    const api = useApi();
    const { call } = useEventManager();
    const { createNotification } = useNotifications();
    const getAddresses = useGetAddresses();
    const getAddressKeys = useGetAddressKeys();
    const createKTVerifier = useKTVerifier();

    const handleSetAddressFlags: ReturnValue['handleSetAddressFlags'] = useCallback(
        async ({ encryptionDisabled, expectSignatureDisabled, notify = true }) => {
            if (!initialAddress) {
                throw new Error('No address provided');
            }
            const { keyTransparencyVerify } = await createKTVerifier();
            const address = (await getAddresses()).find((otherAddress) => initialAddress.ID === otherAddress.ID);
            if (!address) {
                throw new Error('Address deleted');
            }
            await setAddressFlags({
                encryptionDisabled,
                expectSignatureDisabled,
                addressKeys: await getAddressKeys(address.ID),
                address,
                keyTransparencyVerify,
                api,
            });
            await call();
            if (notify) {
                createNotification({ text: c('Success notification').t`Preference updated` });
            }
        },
        [initialAddress?.ID]
    );

    const allowDisablingEncryption = !initialAddress?.ProtonMX;

    return {
        allowDisablingEncryption,
        encryptionDisabled: initialAddress ? encryptionDisabled(initialAddress) : false,
        expectSignatureDisabled: initialAddress ? expectSignatureDisabled(initialAddress) : false,
        handleSetAddressFlags,
    };
};

export default useAddressFlags;
