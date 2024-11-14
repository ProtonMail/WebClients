import { c } from 'ttag';

import { setNoEncryptFlag } from '@proton/account';
import { useGetUser } from '@proton/account/user/hooks';
import useKTVerifier from '@proton/components/containers/keyTransparency/useKTVerifier';
import { setAddressFlags } from '@proton/components/hooks/helpers/addressFlagsHelper';
import useApi from '@proton/components/hooks/useApi';
import useNotifications from '@proton/components/hooks/useNotifications';
import type { PrivateKeyReference } from '@proton/crypto/lib';
import { CryptoProxy } from '@proton/crypto/lib';
import { baseUseDispatch } from '@proton/react-redux-store';
import { expectSignatureDisabled } from '@proton/shared/lib/helpers/address';
import type { Address, DecryptedAddressKey } from '@proton/shared/lib/interfaces';

import useGroupKeys from './useGroupKeys';

const useGroupCrypto = () => {
    const { createNotification } = useNotifications();
    const api = useApi();
    const getUser = useGetUser();
    const silentApi = <T>(config: any) => api<T>({ ...config, silence: true });
    const { keyTransparencyVerify } = useKTVerifier(silentApi, getUser);
    const { getGroupAddressKey } = useGroupKeys();
    const dispatch = baseUseDispatch();

    const signMemberEmail = async (memberEmail: string, groupKey: PrivateKeyReference) => {
        return CryptoProxy.signMessage({
            textData: memberEmail,
            signingKeys: groupKey,
            context: { critical: true, value: 'account.key-token.address' },
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

        await setAddressFlags({
            encryptionDisabled: flagState,
            expectSignatureDisabled: expectSignatureDisabled(forwarderAddress),
            address: forwarderAddress,
            addressesKeys: [
                {
                    address: forwarderAddress,
                    keys: [forwarderKey],
                },
            ],
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
