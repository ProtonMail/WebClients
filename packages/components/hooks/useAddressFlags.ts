import { c } from 'ttag';

import { FeatureCode } from '@proton/components/containers/features';
import { useKTVerifier } from '@proton/components/containers/keyTransparency';
import { getNewKeyFlags } from '@proton/components/containers/keys/shared/flags';
import { FlagAction } from '@proton/components/containers/keys/shared/interface';
import {
    useAddressesKeys,
    useApi,
    useEventManager,
    useFeature,
    useNotifications,
    useUser,
} from '@proton/components/hooks';
import { setAddressFlags } from '@proton/shared/lib/api/members';
import { ADDRESS_FLAGS } from '@proton/shared/lib/constants';
import { Address } from '@proton/shared/lib/interfaces';
import { getActiveKeys, getNormalizedActiveKeys } from '@proton/shared/lib/keys/getActiveKeys';
import { getSignedKeyList } from '@proton/shared/lib/keys/signedKeyList';

type UseAddressFlags = {
    encryptionDisabled: boolean;
    expectSignatureDisabled: boolean;
    handleSetAddressFlags: (encryptionDisabled: boolean, expectSignatureDisabled: boolean) => Promise<void>;
};

const useAddressFlags = (address: Address): UseAddressFlags | null => {
    const api = useApi();
    const { call } = useEventManager();
    const { createNotification } = useNotifications();
    const [User] = useUser();
    const [addressesKeys] = useAddressesKeys();
    const { keyTransparencyVerify } = useKTVerifier(api, async () => User);
    const mailForwardingFeature = useFeature<boolean>(FeatureCode.MailForwarding);
    const isMailForwardingEnabled = !mailForwardingFeature.loading && mailForwardingFeature.feature?.Value === true;

    if (address.Flags === undefined || !isMailForwardingEnabled) {
        return null;
    }

    const handleSetAddressFlags = async (
        encryptionDisabled: boolean,
        expectSignatureDisabled: boolean
    ): Promise<void> => {
        const addressID = address.ID;
        const addressWithKeys = addressesKeys?.find(({ address }) => address.ID === addressID);
        const addressKeys = addressWithKeys?.keys;

        if (addressKeys === undefined) {
            throw new Error('addressKeys is undefined!');
        }

        const activeKeys = await getActiveKeys(address, address.SignedKeyList, address.Keys, addressKeys);
        const updatedActiveKeys = getNormalizedActiveKeys(
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
        const SignedKeyList = await getSignedKeyList(updatedActiveKeys, address, keyTransparencyVerify);

        await api(setAddressFlags(address.ID, !encryptionDisabled, !expectSignatureDisabled, SignedKeyList));
        await call();
        createNotification({ text: c('Success notification').t`Address flags set` });
    };

    const encryptionDisabled = (address.Flags & ADDRESS_FLAGS.FLAG_DISABLE_E2EE) !== 0;
    const expectSignatureDisabled = (address.Flags & ADDRESS_FLAGS.FLAG_DISABLE_EXPECTED_SIGNED) !== 0;

    return {
        encryptionDisabled,
        expectSignatureDisabled,
        handleSetAddressFlags,
    };
};

export default useAddressFlags;
