import type { KTVerifier } from '@proton/key-transparency/helpers';
import { resignSKLWithPrimaryKey } from '@proton/key-transparency/shared';
import type {
    Address,
    Api,
    DecryptedAddressKey,
    DecryptedKey,
    KeyTransparencyActivation,
    UserModel,
} from '@proton/shared/lib/interfaces';
import { getPrimaryAddressKeysForSigning, unsetV6PrimaryAddressKey } from '@proton/shared/lib/keys';

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
