import {
    useAddresses,
    useApi,
    useAuthentication,
    useGetOrganizationKey,
    useGetPublicKeysForInbox,
    useGetUser,
    useGetUserKeys,
    useKTVerifier,
    useNotifications,
} from '@proton/components';
import type { PrivateKeyReference } from '@proton/crypto/lib';
import { KEYGEN_CONFIGS, KEYGEN_TYPES } from '@proton/shared/lib/constants';
import type { Address, DecryptedAddressKey } from '@proton/shared/lib/interfaces';
import { addAddressKeysProcess } from '@proton/shared/lib/keys';
import { getDecryptedGroupAddressKey } from '@proton/shared/lib/keys/groupKeys';

const keyGenConfig = KEYGEN_CONFIGS[KEYGEN_TYPES.CURVE25519];

const useGroupKeys = () => {
    const getUserKeys = useGetUserKeys();
    const api = useApi();
    const { keyTransparencyVerify, keyTransparencyCommit } = useKTVerifier(api, useGetUser());
    const authentication = useAuthentication();
    const [addresses = []] = useAddresses();
    const getPublicKeysForInbox = useGetPublicKeysForInbox();
    const { createNotification } = useNotifications();
    const getOrganizationKey = useGetOrganizationKey();

    const addNewGroupAddressMemberKey = async (groupAddress: Address, groupAddressKey: DecryptedAddressKey) => {
        const userKeys = await getUserKeys();
        const [newKey] = await addAddressKeysProcess({
            api,
            userKeys,
            keyGenConfig,
            addresses,
            address: groupAddress,
            addressKeys: [groupAddressKey],
            keyPassword: authentication.getPassword(),
            keyTransparencyVerify,
        });
        const { privateKey: groupKey } = newKey;
        await keyTransparencyCommit(userKeys);

        return {
            groupKey,
            groupAddressKey,
        };
    };

    const getGroupAddressKey = async (
        groupAddress: Address,
        // this function is faster if called with organizationKey
        organizationKey: PrivateKeyReference | undefined = undefined
    ): Promise<DecryptedAddressKey> => {
        if (organizationKey === undefined) {
            const cachedOrganizationKey = await getOrganizationKey();
            if (cachedOrganizationKey.privateKey === undefined) {
                throw new Error('Organization key is undefined');
            }
            organizationKey = cachedOrganizationKey.privateKey;
        }

        const encryptedKeys = groupAddress.Keys;
        const groupAddressKey = await getDecryptedGroupAddressKey(encryptedKeys, organizationKey);

        if (groupAddressKey === undefined) {
            throw new Error('Missing group address keys');
        }

        if (groupAddressKey.privateKey === undefined) {
            throw new Error('Missing group address private key');
        }

        return groupAddressKey;
    };

    const getMemberPublicKeys = async (memberEmail: string) => {
        const memberPublicKeys = await getPublicKeysForInbox({
            email: memberEmail,
            lifetime: 0,
            noCache: true,
        });

        if (memberPublicKeys.Errors) {
            memberPublicKeys.Errors.forEach((error: string) => {
                createNotification({ text: error, type: 'error' });
            });
            throw new Error('Failed to get member public keys');
        }

        return memberPublicKeys;
    };

    return {
        addNewGroupAddressMemberKey,
        getGroupAddressKey,
        getMemberPublicKeys,
    };
};

export default useGroupKeys;
