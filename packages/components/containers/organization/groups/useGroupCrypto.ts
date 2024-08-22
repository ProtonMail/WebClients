import { c } from 'ttag';

import { useApi, useEventManager, useGetUser, useKTVerifier, useNotifications } from '@proton/components';
import { setAddressFlags } from '@proton/components/hooks/helpers/addressFlagsHelper';
import type { PrivateKeyReference } from '@proton/crypto/lib';
import { CryptoProxy } from '@proton/crypto/lib';
import { expectSignatureDisabled } from '@proton/shared/lib/helpers/address';
import type { Address, DecryptedAddressKey } from '@proton/shared/lib/interfaces';

import useGroupKeys from './useGroupKeys';

const useGroupCrypto = () => {
    const { createNotification } = useNotifications();
    const api = useApi();
    const getUser = useGetUser();
    const silentApi = <T>(config: any) => api<T>({ ...config, silence: true });
    const { keyTransparencyVerify } = useKTVerifier(silentApi, getUser);
    const { call } = useEventManager();
    const { getGroupAddressKey } = useGroupKeys();

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
        await call();
        createNotification({ text: c('Success notification').t`Preferences updated` });
    };

    const disableEncryption = async (
        forwarderAddress: Address,
        forwarderKey: DecryptedAddressKey | undefined = undefined
    ) => {
        await setDisableE2EEFlagState(true, forwarderAddress, forwarderKey);
    };

    const enableEncryption = async (
        forwarderAddress: Address,
        forwarderKey: DecryptedAddressKey | undefined = undefined
    ) => {
        await setDisableE2EEFlagState(false, forwarderAddress, forwarderKey);
    };

    return {
        signMemberEmail,
        disableEncryption,
        enableEncryption,
    };
};

export default useGroupCrypto;
