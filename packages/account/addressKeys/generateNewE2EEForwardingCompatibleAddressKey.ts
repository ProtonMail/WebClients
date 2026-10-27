import type { KTVerifier } from '@proton/key-transparency/helpers/createKTVerifier';
import { KEYGEN_CONFIGS, KEYGEN_TYPES } from '@proton/shared/lib/constants';
import type { Address } from '@proton/shared/lib/interfaces/Address';
import type { Api } from '@proton/shared/lib/interfaces/Api';
import type { DecryptedAddressKey, DecryptedKey } from '@proton/shared/lib/interfaces/Key';
import type { UserModel } from '@proton/shared/lib/interfaces/User';
import { addAddressKeysProcess } from '@proton/shared/lib/keys/add/addKeysProcess';

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
