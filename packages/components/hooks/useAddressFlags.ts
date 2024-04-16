import { c } from 'ttag';

import { useKTVerifier } from '@proton/components/containers/keyTransparency';
import { getNewKeyFlags } from '@proton/components/containers/keys/shared/flags';
import { FlagAction } from '@proton/components/containers/keys/shared/interface';
import { useAddressesKeys, useApi, useEventManager, useNotifications, useUser } from '@proton/components/hooks';
import { updateAddressFlags } from '@proton/shared/lib/api/members';
import { ADDRESS_FLAGS } from '@proton/shared/lib/constants';
import { hasBit } from '@proton/shared/lib/helpers/bitset';
import { Address } from '@proton/shared/lib/interfaces';
import { getActiveKeys, getNormalizedActiveKeys } from '@proton/shared/lib/keys/getActiveKeys';
import { getSignedKeyListWithDeferredPublish } from '@proton/shared/lib/keys/signedKeyList';

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
    const [User] = useUser();
    const [addressesKeys] = useAddressesKeys();
    const { keyTransparencyVerify } = useKTVerifier(api, async () => User);

    if (!address || address.Flags === undefined) {
        return null;
    }

    const handleSetAddressFlags = async (
        encryptionDisabled: boolean,
        expectSignatureDisabled: boolean
    ): Promise<void> => {
        const { ID: addressID, SignedKeyList: currentSignedKeyList, Keys: currentKeys } = address;
        const addressWithKeys = addressesKeys?.find(({ address: { ID } }) => ID === addressID);
        if (addressWithKeys === undefined) {
            throw new Error('addressWithKeys is undefined!');
        }

        const { keys } = addressWithKeys;

        const activeKeys = await getActiveKeys(address, currentSignedKeyList, currentKeys, keys);
        const newActiveKeys = getNormalizedActiveKeys(
            address,
            activeKeys.map((activeKey) => ({
                ...activeKey,
                flags: getNewKeyFlags(
                    getNewKeyFlags(
                        activeKey.flags,
                        encryptionDisabled ? FlagAction.DISABLE_ENCRYPTION : FlagAction.ENABLE_ENCRYPTION
                    ),
                    expectSignatureDisabled ? FlagAction.DISABLE_EXPECT_SIGNED : FlagAction.ENABLE_EXPECT_SIGNED
                ),
            }))
        );
        const [newSignedKeyList, onSKLPublishSuccess] = await getSignedKeyListWithDeferredPublish(
            newActiveKeys,
            address,
            keyTransparencyVerify
        );
        await api(updateAddressFlags(address.ID, !encryptionDisabled, !expectSignatureDisabled, newSignedKeyList));
        await onSKLPublishSuccess();
        await call();
        createNotification({ text: c('Success notification').t`Preference updated` });
    };

    const allowDisablingEncryption = !address.ProtonMX;
    const encryptionDisabled = hasBit(address.Flags, ADDRESS_FLAGS.FLAG_DISABLE_E2EE);
    const expectSignatureDisabled = hasBit(address.Flags, ADDRESS_FLAGS.FLAG_DISABLE_EXPECTED_SIGNED);

    return {
        allowDisablingEncryption,
        encryptionDisabled,
        expectSignatureDisabled,
        handleSetAddressFlags,
    };
};

export default useAddressFlags;
