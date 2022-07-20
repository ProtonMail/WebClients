import { CryptoProxy } from './proxy';
import { KeyReference, PrivateKeyReference } from '../worker/api.models';

/**
 * Find the key that generated the given signature.
 * If the signature is signed by multiple keys, only one matching key is returned.
 * Either `binarySignature` or `armoredSignature` must be provided.
 * @param keys - keys to search
 * @return signing key, if found among `keys`
 */
export async function getMatchingSigningKey(options: {
    armoredSignature: string;
    keys: KeyReference[];
}): Promise<KeyReference | undefined>;
export async function getMatchingSigningKey(options: {
    binarySignature: Uint8Array;
    keys: KeyReference[];
}): Promise<KeyReference | undefined>;
export async function getMatchingSigningKey(options: {
    binarySignature?: Uint8Array;
    armoredSignature?: string;
    keys: KeyReference[];
}): Promise<KeyReference | undefined> {
    const { binarySignature, armoredSignature, keys } = options;

    const { signingKeyIDs } = binarySignature
        ? await CryptoProxy.getSignatureInfo({ binarySignature })
        : await CryptoProxy.getSignatureInfo({ armoredSignature: armoredSignature! });

    for (const signingKeyID of signingKeyIDs) {
        // If the signing key is a subkey, we still return the full key entity
        const signingKey = keys.find((key) => {
            const keyIDs = key.getKeyIDs();
            return keyIDs.indexOf(signingKeyID) >= 0;
        });
        if (signingKey) {
            return signingKey;
        }
    }
}

/**
 * Create public key reference given a private key one.
 * The returned key reference is independent of the input one (i.e. clearing either key reference does not affect the other).
 * NOTE: this function is is considerably more expensive than the former `key.toPublic()`. It is only intended for long-term storage of the public key, as a new key entry will be added to the internal key store.
 * When using `CryptoProxy`, it is safe to pass a `PrivateKeyReference` where a `PublicKeyReference` is expected.
 */
export async function toPublicKeyReference(privateKey: PrivateKeyReference) {
    return CryptoProxy.importPublicKey({
        binaryKey: await CryptoProxy.exportPublicKey({ key: privateKey, format: 'binary' }),
    });
}
