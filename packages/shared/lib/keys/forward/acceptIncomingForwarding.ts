import { CryptoProxy, type PrivateKeyReferenceV4 } from '@proton/crypto';

import { getAndVerifyApiKeys } from '../../api/helpers/getAndVerifyApiKeys';
import type {
    Address,
    Api,
    DecryptedAddressKey,
    DecryptedKey,
    IncomingAddressForwarding,
    KTUserContext,
    KeyTransparencyCommit,
    KeyTransparencyVerify,
    UserModel,
} from '../../interfaces';
import { decryptMemberToken, getActiveAddressKeys, getAddressKeyToken, getEmailFromKey, splitKeys } from '../../keys';
import { generateForwardingAddressKey } from '../../keys/forward/keyHelpers';

interface AcceptIncomingForwardingParameters {
    api: Api;
    address: Address;
    addressKeys: DecryptedAddressKey[];
    user: UserModel;
    userKeys: DecryptedKey[];
    forward: IncomingAddressForwarding;
    keyTransparencyVerify: KeyTransparencyVerify;
    keyTransparencyCommit: KeyTransparencyCommit;
    ktUserContext: KTUserContext;
}

export const acceptIncomingForwarding = async ({
    api,
    address,
    addressKeys: forwardeeAddressKeys,
    user,
    userKeys,
    forward,
    keyTransparencyVerify,
    keyTransparencyCommit,
    ktUserContext,
}: AcceptIncomingForwardingParameters) => {
    if (!address) {
        throw new Error('No address');
    }

    const forwardeeEmail = address.Email;
    const splitUserKeys = splitKeys(userKeys);
    const splitAddressKeys = splitKeys(forwardeeAddressKeys);
    const [primaryAddressKey] = address.Keys;

    if (!primaryAddressKey || !primaryAddressKey.Token) {
        throw new Error('No primary address key');
    }

    const decryptedPrimaryAddressKeyToken = await getAddressKeyToken({
        Token: primaryAddressKey.Token,
        Signature: primaryAddressKey.Signature,
        privateKeys: splitUserKeys.privateKeys,
        publicKeys: splitUserKeys.publicKeys,
    });

    const { addressKeys: forwarderAddressKeys } = await getAndVerifyApiKeys({
        api,
        email: forward.ForwarderEmail,
        ktUserContext,
        internalKeysOnly: true,
    });

    const forwarderPublicKeys = forwarderAddressKeys.map(({ publicKey }) => publicKey);

    let activeKeys = await getActiveAddressKeys(address.SignedKeyList, forwardeeAddressKeys);

    // Multiple ForwardingKeys objects are present if e.g. the forwarder changed their primary key and updated/re-enabled
    // the forwarding request while it was still pending (yet to be accepted by the forwardee).
    for (const forwardingKey of forward.ForwardingKeys || []) {
        const decryptedToken = await decryptMemberToken(
            forwardingKey.ActivationToken,
            splitAddressKeys.privateKeys,
            forwarderPublicKeys
        );
        let privateKey = await CryptoProxy.importPrivateKey({
            armoredKey: forwardingKey.PrivateKey,
            passphrase: decryptedToken,
        });
        if (!privateKey.isPrivateKeyV4()) {
            // this should be unreachable since v6 keys do not support forwarding atm
            throw new Error('Unexpected v6 key');
        }
        const extractedEmail = getEmailFromKey(privateKey);

        // The forwardee email address can change before the user has accepted the forwarding
        // So we need to update the private key with the email address returned by the API
        // Use strict comparison because capitalization matters
        if (extractedEmail !== forwardeeEmail) {
            const updatedPrivateKey = await CryptoProxy.cloneKeyAndChangeUserIDs({
                userIDs: [{ name: forwardeeEmail, email: forwardeeEmail }],
                privateKey,
            });
            await CryptoProxy.clearKey({ key: privateKey });
            privateKey = updatedPrivateKey;
        }

        const armoredPrivateKey = await CryptoProxy.exportPrivateKey({
            privateKey,
            passphrase: decryptedPrimaryAddressKeyToken,
        });
        const [, updatedActiveKeys] = await generateForwardingAddressKey({
            api,
            address,
            keyTransparencyVerify,
            addressForwardingID: forward.ID,
            encryptedToken: primaryAddressKey.Token,
            signature: primaryAddressKey.Signature,
            privateKeyArmored: armoredPrivateKey,
            activeKeys,
            privateKey: privateKey as PrivateKeyReferenceV4,
        });
        await keyTransparencyCommit(user, userKeys);
        activeKeys = updatedActiveKeys;
    }
};
