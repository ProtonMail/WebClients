import { CryptoProxy } from '@protontech/crypto';

import { KT_SKL_SIGNING_CONTEXT } from '@proton/key-transparency/constants';
import isTruthy from '@proton/utils/isTruthy';

import { getIsAddressDisabled } from '../helpers/addressStatus';
import type {
    ActiveAddressKeysByVersion,
    Address,
    Api,
    DecryptedAddressKey,
    KeyMigrationKTVerifier,
    KeyTransparencyVerify,
    SignedKeyList,
} from '../interfaces';
import { getActiveAddressKeys, getNormalizedActiveAddressKeys } from './getActiveKeys';
import { type PrimaryAddressKeysForSigning, getPrimaryAddressKeysForSigning } from './getPrimaryKey';

export { ParsedSignedKeyList } from './parsedSignedKeyList';

export const getSignedKeyListSignature = async (
    data: string,
    signingKeys: PrimaryAddressKeysForSigning,
    date?: Date
) => {
    const signature = await CryptoProxy.signMessage({
        textData: data,
        stripTrailingSpaces: true,
        signingKeys,
        detached: true,
        signatureContext: KT_SKL_SIGNING_CONTEXT,
        date,
    });
    return signature;
};

export type OnSKLPublishSuccess = () => Promise<void>;

/**
 * Generate the signed key list data and verify it for later commit to Key Transparency.
 * The SKL is only considered in the later commit call if the returned OnSKLPublishSuccess closure
 * has been called beforehand.
 */
export const getSignedKeyListWithDeferredPublish = async (
    keys: ActiveAddressKeysByVersion,
    address: Address,
    keyTransparencyVerify: KeyTransparencyVerify
): Promise<[SignedKeyList, OnSKLPublishSuccess]> => {
    // the v6 primary key (if present) must come after the v4 one
    const list = [...keys.v4, ...keys.v6].sort((a, b) => b.primary - a.primary);
    const transformedKeys = (
        await Promise.all(
            list.map(async ({ privateKey, flags, primary, sha256Fingerprints, fingerprint }) => {
                const result = await CryptoProxy.isE2EEForwardingKey({ key: privateKey });

                if (result) {
                    return false;
                }

                return {
                    Primary: primary,
                    Flags: flags,
                    Fingerprint: fingerprint,
                    SHA256Fingerprints: sha256Fingerprints,
                };
            })
        )
    ).filter(isTruthy);
    const data = JSON.stringify(transformedKeys);
    const signingKeys = getPrimaryAddressKeysForSigning(keys, true);
    if (!signingKeys.length) {
        throw new Error('Missing primary signing key');
    }

    // TODO: Could be filtered as well
    const publicKeys = list.map((key) => key.publicKey);

    const signedKeyList: SignedKeyList = {
        Data: data,
        Signature: await getSignedKeyListSignature(data, signingKeys),
    };
    const onSKLPublish = async () => {
        if (!getIsAddressDisabled(address)) {
            await keyTransparencyVerify(address, signedKeyList, publicKeys);
        }
    };
    return [signedKeyList, onSKLPublish];
};

/**
 * Generate the signed key list data and verify it for later commit to Key Transparency
 */
export const getSignedKeyList = async (
    keys: ActiveAddressKeysByVersion,
    address: Address,
    keyTransparencyVerify: KeyTransparencyVerify
): Promise<SignedKeyList> => {
    const [signedKeyList, onSKLPublishSuccess] = await getSignedKeyListWithDeferredPublish(
        keys,
        address,
        keyTransparencyVerify
    );
    await onSKLPublishSuccess();
    return signedKeyList;
};

export const createSignedKeyListForMigration = async ({
    address,
    decryptedKeys,
    keyMigrationKTVerifier,
    keyTransparencyVerify,
    api,
}: {
    api: Api;
    address: Address;
    decryptedKeys: DecryptedAddressKey[];
    keyTransparencyVerify: KeyTransparencyVerify;
    keyMigrationKTVerifier: KeyMigrationKTVerifier;
}): Promise<[SignedKeyList | undefined, OnSKLPublishSuccess | undefined]> => {
    let signedKeyList: SignedKeyList | undefined;
    let onSKLPublishSuccess: OnSKLPublishSuccess | undefined;
    if (!address.SignedKeyList || address.SignedKeyList.ObsolescenceToken) {
        // Only create a new signed key list if the address does not have one already
        // or the signed key list is obsolete.
        await keyMigrationKTVerifier({ email: address.Email, signedKeyList: address.SignedKeyList, api });
        const activeKeys = getNormalizedActiveAddressKeys(
            address,
            await getActiveAddressKeys(address.SignedKeyList, decryptedKeys)
        );
        if (activeKeys.v4.length > 0) {
            // v4 keys always presents, no need to check for v6 ones
            [signedKeyList, onSKLPublishSuccess] = await getSignedKeyListWithDeferredPublish(
                activeKeys,
                address,
                keyTransparencyVerify
            );
        }
    }
    return [signedKeyList, onSKLPublishSuccess];
};
