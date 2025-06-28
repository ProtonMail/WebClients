import { c } from 'ttag';

import { setNoEncryptFlag } from '@proton/account';
import useKTVerifier from '@proton/components/containers/keyTransparency/useKTVerifier';
import useApi from '@proton/components/hooks/useApi';
import useNotifications from '@proton/components/hooks/useNotifications';
import type { PrivateKeyReference } from '@proton/crypto/lib';
import { CryptoProxy } from '@proton/crypto/lib';
import { baseUseDispatch } from '@proton/react-redux-store';
import { getIsExpectSignatureDisabled } from '@proton/shared/lib/helpers/address';
import type { Address, DecryptedAddressKey } from '@proton/shared/lib/interfaces';
import { setAddressFlagsHelper } from '@proton/shared/lib/keys/addressFlagsHelper';

import useGroupKeys from './useGroupKeys';

const useGroupCrypto = () => {
    const { createNotification } = useNotifications();
    const api = useApi();
    const createKTVerifier = useKTVerifier();
    const { getGroupAddressKey } = useGroupKeys();
    const dispatch = baseUseDispatch();

    const signMemberEmail = async (memberEmail: string, groupKey: PrivateKeyReference) => {
        return CryptoProxy.signMessage({
            textData: memberEmail,
            signingKeys: groupKey,
            signatureContext: { critical: true, value: 'account.key-token.address' },
            detached: true,
        });
    };

    const setDisableE2EEFlagState = async (
        flagState: boolean, // true to disable e2ee, false to enable
        forwarderAddress: Address,
        // this function is faster if called with forwarderKey
        forwarderKey: DecryptedAddressKey | undefined = undefined
    ) => {
        if (forwarderKey === undefined) {
            forwarderKey = await getGroupAddressKey(forwarderAddress);
        }

        const { keyTransparencyVerify } = await createKTVerifier();
        await setAddressFlagsHelper({
            encryptionDisabled: flagState,
            expectSignatureDisabled: getIsExpectSignatureDisabled(forwarderAddress),
            address: forwarderAddress,
            addressKeys: [forwarderKey],
            keyTransparencyVerify,
            api,
        });

        if (flagState) {
            createNotification({ text: c('Success notification').t`Group end-to-end email encryption disabled` });
        } else {
            createNotification({ text: c('Success notification').t`Group end-to-end email encryption enabled` });
        }
    };

    const disableEncryption = async (
        forwarderAddress: Address,
        forwarderKey: DecryptedAddressKey | undefined = undefined
    ) => {
        await setDisableE2EEFlagState(true, forwarderAddress, forwarderKey);
        dispatch(
            setNoEncryptFlag({
                addressID: forwarderAddress.ID,
                noEncryptFlag: true,
            })
        );
    };

    const enableEncryption = async (
        forwarderAddress: Address,
        forwarderKey: DecryptedAddressKey | undefined = undefined
    ) => {
        await setDisableE2EEFlagState(false, forwarderAddress, forwarderKey);
        dispatch(
            setNoEncryptFlag({
                addressID: forwarderAddress.ID,
                noEncryptFlag: false,
            })
        );
    };

    return {
        signMemberEmail,
        disableEncryption,
        enableEncryption,
    };
};

export default useGroupCrypto;
