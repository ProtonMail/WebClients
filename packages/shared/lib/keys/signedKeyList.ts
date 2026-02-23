import { CryptoProxy } from '@proton/crypto';
import { KT_SKL_SIGNING_CONTEXT } from '@proton/key-transparency';
import isTruthy from '@proton/utils/isTruthy';

import { getIsAddressDisabled } from '../helpers/address';
import type {
    ActiveAddressKeysByVersion,
    Address,
    Api,
    DecryptedAddressKey,
    KeyMigrationKTVerifier,
    KeyTransparencyVerify,
    SignedKeyList,
    SignedKeyListItem,
} from '../interfaces';
import type { SimpleMap } from '../interfaces/utils';
import { getActiveAddressKeys, getNormalizedActiveAddressKeys } from './getActiveKeys';
import { type PrimaryAddressKeysForSigning, getPrimaryAddressKeysForSigning } from './getPrimaryKey';

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

const signedKeyListItemParser = ({ Primary, Flags, Fingerprint, SHA256Fingerprints }: any) =>
    (Primary === 0 || Primary === 1) &&
    typeof Flags === 'number' &&
    typeof Fingerprint === 'string' &&
    Array.isArray(SHA256Fingerprints) &&
    SHA256Fingerprints.every((fingerprint) => typeof fingerprint === 'string');

export class ParsedSignedKeyList {
    private parsedSignedKeyList: SignedKeyListItem[] | null;

    constructor(data?: string) {
        if (!data) {
            this.parsedSignedKeyList = null;
            return;
        }

        try {
            const parsedDataToValidate = JSON.parse(data);
            if (Array.isArray(parsedDataToValidate) && parsedDataToValidate.every(signedKeyListItemParser)) {
                this.parsedSignedKeyList = parsedDataToValidate;
            } else {
                this.parsedSignedKeyList = null;
            }
        } catch (e: any) {
            this.parsedSignedKeyList = null;
        }
    }

    getParsedSignedKeyList() {
        return this.parsedSignedKeyList;
    }

    /**
     * @returns mapping between the ID of each address key to the corresponding parsed SKL item
     */
    mapAddressKeysToSKLItems(keys: { ID: string; sha256Fingerprints: string[] }[]) {
        const parsedSignedKeyList = this.getParsedSignedKeyList();
        if (!parsedSignedKeyList) {
            return {};
        }
        /**
         * NB:
         * - Primary key fingerprint is not guaranteed to be unique
         * - there exist old users who have duplicate keys (same subkey fingerprints too)
         **/
        const mapFingerprintsToItems = parsedSignedKeyList.reduce<SimpleMap<SignedKeyListItem[]>>((acc, cur) => {
            const fingerprints = cur.SHA256Fingerprints.join();
            if (acc[fingerprints]) {
                acc[fingerprints].push(cur);
            } else {
                acc[fingerprints] = [cur];
            }
            return acc;
        }, {});

        const resultMap: SimpleMap<SignedKeyListItem | undefined> = {};
        for (const { ID, sha256Fingerprints } of keys) {
            const sklItems = mapFingerprintsToItems[sha256Fingerprints.join()];
            if (!sklItems) {
                resultMap[ID] = undefined;
            } else if (sklItems.length === 1) {
                resultMap[ID] = sklItems[0];
            } else {
                // Edge case, user has identical keys: we just trust the `keys` order for the matching.
                // This can cause matching issues if e.g. the SKL contains duplicate keys that are now inactive,
                // hence they are not necessarily passed as `keys` (depending on the caller use-case).
                // We do not address these edge-cases as we don't expect any user to actually have such setups.
                resultMap[ID] = sklItems[0];
                sklItems.splice(0, 1);
            }
        }
        return resultMap;
    }
}
