import { CryptoProxy, PrivateKeyReference } from '@proton/crypto';
import { LinkType, ShareMapLink } from '@proton/shared/lib/interfaces/drive/link';
import { decryptUnsigned } from '@proton/shared/lib/keys/driveKeys';
import { decryptPassphrase } from '@proton/shared/lib/keys/drivePassphrase';

export type DecryptAndCacheLink = (
    linkMeta: ShareMapLink,
    parentPrivateKey: PrivateKeyReference
) => Promise<{ name: string }>;
export type GetCachedParentPrivateKey = (linkId: string | null) => PrivateKeyReference | undefined;

export const LINK_KEYS_NOT_FOUND_MESSAGE = "ES Indexing: parent link key wasn't not found.";

export interface KeyCache {
    getCachedPrivateKey: GetCachedParentPrivateKey;
    decryptAndCacheLink: DecryptAndCacheLink;
}

export const createKeysCache = (rootKey: PrivateKeyReference): KeyCache => {
    const keyCache = new Map<string | null, PrivateKeyReference>();
    keyCache.set(null, rootKey);

    const getCachedPrivateKey: GetCachedParentPrivateKey = (linkId) => {
        return keyCache.get(linkId);
    };

    // XXX: move to a worker some time in the future
    const decryptAndCacheLink: DecryptAndCacheLink = async (linkMeta, parentPrivateKey) => {
        /*
         * If link is a folder, we need to decrypt its NodeKey in order to be able
         * to decrypt its children names later on
         */
        if (linkMeta.Type === LinkType.FOLDER) {
            const { decryptedPassphrase } = await decryptPassphrase({
                armoredPassphrase: linkMeta.NodePassphrase!,
                armoredSignature: linkMeta.NodePassphraseSignature!,
                privateKeys: [parentPrivateKey],
                publicKeys: [],
                validateSignature: false,
            });

            const linkPrivateKey = await CryptoProxy.importPrivateKey({
                armoredKey: linkMeta.NodeKey!,
                passphrase: decryptedPassphrase,
            });
            keyCache.set(linkMeta.LinkID, linkPrivateKey);
        }

        const name = await decryptUnsigned({ armoredMessage: linkMeta.Name, privateKey: parentPrivateKey });

        return { name };
    };

    return {
        decryptAndCacheLink,
        getCachedPrivateKey,
    };
};
