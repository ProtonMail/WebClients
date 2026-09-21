import type { KTVerifier } from '@proton/key-transparency/helpers';
import { KEYGEN_CONFIGS, KEYGEN_TYPES } from '@proton/shared/lib/constants';
import type { Address, Api, DecryptedAddressKey, DecryptedKey, UserModel } from '@proton/shared/lib/interfaces';
import { addAddressKeysProcess } from '@proton/shared/lib/keys';

export const generateNewE2EEForwardingCompatibleAddressKey = async ({
    api,
    forwarderAddress,
    addresses,
    addressKeys,
    User,
    userKeys,
    ktVerifier,
    keyPassword,
}: {
    api: Api;
    forwarderAddress: Address;
    addresses: Address[];
    addressKeys: DecryptedAddressKey[];
    User: UserModel;
    userKeys: DecryptedKey[];
    ktVerifier: KTVerifier;
    keyPassword: string;
}) => {
    const { keyTransparencyVerify, keyTransparencyCommit } = ktVerifier;
    const [newKey] = await addAddressKeysProcess({
        api,
        userKeys,
        keyGenConfig: KEYGEN_CONFIGS[KEYGEN_TYPES.CURVE25519],
        addresses,
        address: forwarderAddress,
        addressKeys,
        keyPassword,
        keyTransparencyVerify,
    });

    await keyTransparencyCommit(User, userKeys);

    return newKey;
};
