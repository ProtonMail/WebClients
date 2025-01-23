import { c } from 'ttag';

import { useGetAddressKeys } from '@proton/account/addressKeys/hooks';
import useKTVerifier from '@proton/components/containers/keyTransparency/useKTVerifier';
import useEventManager from '@proton/components/hooks/useEventManager';
import useNotifications from '@proton/components/hooks/useNotifications';
import { encryptionDisabled, expectSignatureDisabled } from '@proton/shared/lib/helpers/address';
import type { Address } from '@proton/shared/lib/interfaces';

import { setAddressFlags } from './helpers/addressFlagsHelper';
import useApi from './useApi';

type UseAddressFlags = (address?: Address) => {
    allowDisablingEncryption: boolean;
    encryptionDisabled: boolean;
    expectSignatureDisabled: boolean;
    handleSetAddressFlags: (encryptionDisabled: boolean, expectSignatureDisabled: boolean) => Promise<void>;
} | null;

const useAddressFlags: UseAddressFlags = (address) => {
    const api = useApi();
    const { call } = useEventManager();
    const { createNotification } = useNotifications();
    const getAddressKeys = useGetAddressKeys();
    const createKTVerifier = useKTVerifier();

    if (!address || address.Flags === undefined) {
        return null;
    }

    const handleSetAddressFlags = async (
        encryptionDisabled: boolean,
        expectSignatureDisabled: boolean
    ): Promise<void> => {
        const { keyTransparencyVerify } = await createKTVerifier();
        await setAddressFlags({
            encryptionDisabled,
            expectSignatureDisabled,
            addressKeys: await getAddressKeys(address.ID),
            address,
            keyTransparencyVerify,
            api,
        });
        await call();
        createNotification({ text: c('Success notification').t`Preference updated` });
    };

    const allowDisablingEncryption = !address.ProtonMX;

    return {
        allowDisablingEncryption,
        encryptionDisabled: encryptionDisabled(address),
        expectSignatureDisabled: expectSignatureDisabled(address),
        handleSetAddressFlags,
    };
};

export default useAddressFlags;
