import type { KTVerifier } from '@proton/key-transparency/helpers';
import { resignSKLWithPrimaryKey } from '@proton/key-transparency/shared';
import type { Address } from '@proton/shared/lib/interfaces/Address';
import type { Api } from '@proton/shared/lib/interfaces/Api';
import type { DecryptedAddressKey, DecryptedKey } from '@proton/shared/lib/interfaces/Key';
import type { KeyTransparencyActivation } from '@proton/shared/lib/interfaces/KeyTransparency';
import type { UserModel } from '@proton/shared/lib/interfaces/User';
import { unsetV6PrimaryAddressKey } from '@proton/shared/lib/keys/addressKeyActions';
import { getPrimaryAddressKeysForSigning } from '@proton/shared/lib/keys/getPrimaryKey';

export const unsetV6PrimaryKey = async ({
    ID,
    api,
    forwarderAddress,
    addressKeys,
    User,
    userKeys,
    ktVerifier,
    ktActivation,
}: {
    ID: string;
    api: Api;
    forwarderAddress: Address;
    addressKeys: DecryptedAddressKey[];
    User: UserModel;
    userKeys: DecryptedKey[];
    ktVerifier: KTVerifier;
    ktActivation: KeyTransparencyActivation;
}) => {
    const addressKey = addressKeys.find(({ ID: otherID }) => otherID === ID);
    if (!addressKey) {
        throw new Error('Key not found');
    }

    const { keyTransparencyVerify, keyTransparencyCommit } = ktVerifier;
    const [newActiveKeys, formerActiveKeys] = await unsetV6PrimaryAddressKey(
        api,
        forwarderAddress,
        addressKeys,
        ID,
        keyTransparencyVerify
    );
    await Promise.all([
        resignSKLWithPrimaryKey({
            api,
            ktActivation,
            address: forwarderAddress,
            newPrimaryKeys: getPrimaryAddressKeysForSigning(newActiveKeys, true),
            formerPrimaryKeys: getPrimaryAddressKeysForSigning(formerActiveKeys, true),
            userKeys,
        }),
        keyTransparencyCommit(User, userKeys),
    ]);
    return newActiveKeys;
};
