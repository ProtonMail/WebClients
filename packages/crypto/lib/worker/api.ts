/* eslint-disable class-methods-use-this */

/* eslint-disable max-classes-per-file */

/* eslint-disable no-underscore-dangle */
import type { AlgorithmInfo as AlgorithmInfoV5, Argon2Options, Data, Key, PrivateKey, PublicKey } from 'pmcrypto';
import {
    SHA256,
    SHA512,
    argon2,
    armorBytes,
    canKeyEncrypt,
    checkKeyCompatibility,
    checkKeyStrength,
    decryptKey,
    decryptMessage,
    decryptSessionKey,
    doesKeySupportForwarding,
    encryptKey,
    encryptMessage,
    encryptSessionKey,
    generateForwardingMaterial,
    generateKey,
    generateSessionKey,
    generateSessionKeyForAlgorithm,
    getSHA256Fingerprints,
    init as initPmcrypto,
    isExpiredKey,
    isForwardingKey,
    isRevokedKey,
    processMIME,
    readCleartextMessage,
    readKey,
    readKeys,
    readMessage,
    readPrivateKey,
    readSignature,
    reformatKey,
    signMessage,
    unsafeMD5,
    unsafeSHA1,
    verifyCleartextMessage,
    verifyMessage,
} from 'pmcrypto';
import type { SubkeyOptions, UserID } from 'pmcrypto/lib/openpgp';
import { enums } from 'pmcrypto/lib/openpgp';

import { ARGON2_PARAMS } from '../constants';
import { arrayToHexString } from '../utils';
import type {
    AlgorithmInfo,
    ComputeHashStreamOptions,
    KeyInfo,
    KeyReference,
    MaybeArray,
    MessageInfo,
    PrivateKeyReference,
    PublicKeyReference,
    SessionKey as SessionKeyWithoutPlaintextAlgo, // OpenPGP.js v5 has a 'plaintext' algo value for historical reasons.
    SignatureInfo,
    WorkerDecryptionOptions,
    WorkerEncryptOptions,
    WorkerEncryptSessionKeyOptions,
    WorkerGenerateKeyOptions,
    WorkerGenerateSessionKeyOptions,
    WorkerGetKeyInfoOptions,
    WorkerGetMessageInfoOptions,
    WorkerGetSignatureInfoOptions,
    WorkerImportPrivateKeyOptions,
    WorkerImportPublicKeyOptions,
    WorkerProcessMIMEOptions,
    WorkerReformatKeyOptions,
    WorkerSignOptions,
    WorkerVerifyCleartextOptions,
    WorkerVerifyOptions,
} from './api.models';

// Note:
// - streams are currently not supported since they are not Transferable (not in all browsers).
// - when returning binary data, the values are always transferred.

type SerializedSignatureOptions = { armoredSignature?: string; binarySignature?: Uint8Array };
const getSignature = async ({ armoredSignature, binarySignature }: SerializedSignatureOptions) => {
    if (armoredSignature) {
        return readSignature({ armoredSignature });
    } else if (binarySignature) {
        return readSignature({ binarySignature });
    }
    throw new Error('Must provide `armoredSignature` or `binarySignature`');
};

type SerializedMessageOptions = { armoredMessage?: string; binaryMessage?: Uint8Array };
const getMessage = async ({ armoredMessage, binaryMessage }: SerializedMessageOptions) => {
    if (armoredMessage) {
        return readMessage({ armoredMessage });
    } else if (binaryMessage) {
        return readMessage({ binaryMessage });
    }
    throw new Error('Must provide `armoredMessage` or `binaryMessage`');
};

type SerializedKeyOptions = { armoredKey?: string; binaryKey?: Uint8Array };
const getKey = async ({ armoredKey, binaryKey }: SerializedKeyOptions) => {
    if (armoredKey) {
        return readKey({ armoredKey });
    } else if (binaryKey) {
        return readKey({ binaryKey });
    }
    throw new Error('Must provide `armoredKey` or `binaryKey`');
};

const toArray = <T>(maybeArray: MaybeArray<T>) => (Array.isArray(maybeArray) ? maybeArray : [maybeArray]);

const getPublicKeyReference = async (key: PublicKey, keyStoreID: number): Promise<PublicKeyReference> => {
    const publicKey = key.isPrivate() ? key.toPublic() : key; // We don't throw on private key since we allow importing an (encrypted) private key using 'importPublicKey'
    const v5Tov6AlgorithmInfo = (algorithmInfo: AlgorithmInfoV5): AlgorithmInfo => {
        const v5ToV6Curve = (curveName: AlgorithmInfoV5['curve']): AlgorithmInfo['curve'] => {
            switch (curveName) {
                case 'curve25519':
                    return 'curve25519Legacy';
                case 'ed25519':
                    return 'ed25519Legacy';
                case 'p256':
                    return 'nistP256';
                case 'p384':
                    return 'nistP384';
                case 'p521':
                    return 'nistP521';
                default:
                    return curveName;
            }
        };
        switch (algorithmInfo.algorithm) {
            case 'eddsa':
                return {
                    algorithm: 'eddsaLegacy',
                    curve: 'ed25519Legacy',
                };
            case 'ecdh':
                return {
                    algorithm: 'ecdh',
                    curve: v5ToV6Curve(algorithmInfo.curve),
                };
            default:
                const result: AlgorithmInfo = { algorithm: algorithmInfo.algorithm };
                if (algorithmInfo.curve !== undefined) {
                    result.curve = v5ToV6Curve(algorithmInfo.curve);
                }
                if (algorithmInfo.bits !== undefined) {
                    result.bits = algorithmInfo.bits;
                }
                return result;
        }
    };

    const fingerprint = publicKey.getFingerprint();
    const hexKeyID = publicKey.getKeyID().toHex();
    const hexKeyIDs = publicKey.getKeyIDs().map((id) => id.toHex());
    const algorithmInfo = publicKey.getAlgorithmInfo();
    const creationTime = publicKey.getCreationTime();
    const expirationTime = await publicKey.getExpirationTime();
    const userIDs = publicKey.getUserIDs();
    const keyContentHash = await SHA256(publicKey.write()).then(arrayToHexString);
    // Allow comparing keys without third-party certification
    let keyContentHashNoCerts: string;
    // Check if third-party certs are present
    if (publicKey.users.some((user) => user.otherCertifications.length > 0)) {
        // @ts-ignore missing `clone()` definition
        const publicKeyClone: PublicKey = publicKey.clone();
        publicKeyClone.users.forEach((user) => {
            user.otherCertifications = [];
        });
        keyContentHashNoCerts = await SHA256(publicKeyClone.write()).then(arrayToHexString);
    } else {
        keyContentHashNoCerts = keyContentHash;
    }

    let isWeak: boolean;
    try {
        checkKeyStrength(publicKey);
        isWeak = false;
    } catch {
        isWeak = true;
    }
    let compatibilityError: Error;
    try {
        checkKeyCompatibility(publicKey);
    } catch (err: any) {
        compatibilityError = err;
    }
    return {
        _idx: keyStoreID,
        _keyContentHash: [keyContentHash, keyContentHashNoCerts],
        _getCompatibilityError: () => compatibilityError,
        isPrivate: () => false,
        getFingerprint: () => fingerprint,
        getKeyID: () => hexKeyID,
        getKeyIDs: () => hexKeyIDs,
        getAlgorithmInfo: () => v5Tov6AlgorithmInfo(algorithmInfo),
        getCreationTime: () => creationTime,
        getExpirationTime: () => expirationTime,
        getUserIDs: () => userIDs,
        isWeak: () => isWeak,
        equals: (otherKey: KeyReference, ignoreOtherCerts = false) =>
            ignoreOtherCerts
                ? otherKey._keyContentHash[1] === keyContentHashNoCerts
                : otherKey._keyContentHash[0] === keyContentHash,
        subkeys: publicKey.getSubkeys().map((subkey) => {
            const subkeyAlgoInfo = v5Tov6AlgorithmInfo(subkey.getAlgorithmInfo());
            const subkeyKeyID = subkey.getKeyID().toHex();
            return {
                getAlgorithmInfo: () => subkeyAlgoInfo,
                getKeyID: () => subkeyKeyID,
            };
        }),
    } as PublicKeyReference;
};

const getPrivateKeyReference = async (privateKey: PrivateKey, keyStoreID: number): Promise<PrivateKeyReference> => {
    const publicKeyReference = await getPublicKeyReference(privateKey.toPublic(), keyStoreID);
    return {
        ...publicKeyReference,
        isPrivate: () => true,
        _dummyType: 'private',
    } as PrivateKeyReference;
};

class KeyStore {
    private store = new Map<number, Key>();

    /**
     * Monotonic counter keeping track of the next unique identifier to index a newly added key.
     * The starting counter value is picked at random to minimize the changes of collisions between keys during different user sessions.
     * NB: key references may be stored by webapps even after the worker has been destroyed (e.g. after closing the browser window),
     * hence we want to keep using different identifiers even after restarting the worker, to also invalidate those stale key references.
     */
    private nextIdx = crypto.getRandomValues(new Uint32Array(1))[0];

    /**
     * Add a key to the key store.
     * @param key - key to add
     * @param customIdx - custom identifier to use to store the key, instead of the internally generated one.
     *                    This argument is primarily intended for when key store identifiers need to be synchronised across different workers.
     *                    This value must be unique for each key, even across different sessions.
     * @returns key identifier to retrieve the key from the store
     */
    add(key: Key, customIdx?: number) {
        const idx = customIdx !== undefined ? customIdx : this.nextIdx;
        if (this.store.has(idx)) {
            throw new Error(`Idx ${idx} already in use`);
        }
        this.store.set(idx, key);
        this.nextIdx++; // increment regardless of customIdx, for code simplicity
        return idx;
    }

    get(idx: number) {
        const key = this.store.get(idx);
        if (!key) {
            throw new Error('Key not found');
        }
        return key;
    }

    clearAll() {
        this.store.forEach((key) => {
            if (key.isPrivate()) {
                // @ts-ignore missing definition for clearPrivateParams()
                key.clearPrivateParams();
            }
        });
        this.store.clear();
        // no need to reset index
    }

    clear(idx: number) {
        const keyToClear = this.get(idx);
        if (keyToClear.isPrivate()) {
            // @ts-ignore missing definition for clearPrivateParams()
            keyToClear.clearPrivateParams();
        }
        this.store.delete(idx);
    }
}

type SerialisedOutputFormat = 'armored' | 'binary' | undefined;
type SerialisedOutputTypeFromFormat<F extends SerialisedOutputFormat> = F extends 'armored'
    ? string
    : F extends 'binary'
      ? Uint8Array
      : never;

class KeyManagementApi {
    protected keyStore = new KeyStore();

    /**
     * Invalidate all key references by removing all keys from the internal key store.
     * The private key material corresponding to any PrivateKeyReference is erased from memory.
     */
    async clearKeyStore() {
        this.keyStore.clearAll();
    }

    /**
     * Invalidate the key reference by removing the key from the internal key store.
     * If a PrivateKeyReference is given, the private key material is erased from memory.
     */
    async clearKey({ key: keyReference }: { key: KeyReference }) {
        this.keyStore.clear(keyReference._idx);
    }

    /**
     * Generate a key for the given UserID.
     * The key is stored in the key store, and can be exported using `exportPrivateKey` or `exportPublicKey`.
     * @param options.userIDs - user IDs as objects: `{ name: 'Jo Doe', email: 'info@jo.com' }`
     * @param options.type - key algorithm type: ECC (default) or RSA
     * @param options.rsaBits - number of bits for RSA keys
     * @param options.curve - elliptic curve for ECC keys
     * @param options.keyExpirationTime- number of seconds from the key creation time after which the key expires
     * @param options.subkeys - options for each subkey e.g. `[{ sign: true, passphrase: '123'}]`
     * @param options.date - use the given date as creation date of the key and the key signatures, instead of the server time
     * @returns reference to the generated private key
     */
    async generateKey(options: WorkerGenerateKeyOptions) {
        const v6Tov5CurveOption = (curve: WorkerGenerateKeyOptions['curve']) => {
            switch (curve) {
                case 'ed25519Legacy':
                case 'curve25519Legacy':
                    return 'ed25519';
                case 'nistP256':
                    return 'p256';
                case 'nistP384':
                    return 'p384';
                case 'nistP521':
                    return 'p521';
                default:
                    return curve;
            }
        };

        const { privateKey } = await generateKey({
            ...options,
            curve: v6Tov5CurveOption(options.curve),
            subkeys: options.subkeys?.map<SubkeyOptions>((subkeyOptions) => ({
                ...subkeyOptions,
                curve: v6Tov5CurveOption(subkeyOptions.curve),
            })),
            format: 'object',
        });
        // Typescript guards against a passphrase input, but it's best to ensure the option wasn't given since for API simplicity we assume any PrivateKeyReference points to a decrypted key.
        if (!privateKey.isDecrypted()) {
            throw new Error(
                'Unexpected "passphrase" option on key generation. Use "exportPrivateKey" after key generation to obtain a transferable encrypted key.'
            );
        }
        const keyStoreID = this.keyStore.add(privateKey);

        return getPrivateKeyReference(privateKey, keyStoreID);
    }

    async reformatKey({ privateKey: keyReference, ...options }: WorkerReformatKeyOptions) {
        const originalKey = this.keyStore.get(keyReference._idx) as PrivateKey;
        // we have to deep clone before reformatting, since privateParams of reformatted key point to the ones of the given privateKey, and
        // we do not want reformatted key to be affected if the original key reference is cleared/deleted.
        // @ts-ignore - missing .clone() definition
        const keyToReformat = originalKey.clone(true);
        const { privateKey } = await reformatKey({ ...options, privateKey: keyToReformat, format: 'object' });
        // Typescript guards against a passphrase input, but it's best to ensure the option wasn't given since for API simplicity we assume any PrivateKeyReference points to a decrypted key.
        if (!privateKey.isDecrypted()) {
            throw new Error(
                'Unexpected "passphrase" option on key reformat. Use "exportPrivateKey" after key reformatting to obtain a transferable encrypted key.'
            );
        }
        const keyStoreID = this.keyStore.add(privateKey);

        return getPrivateKeyReference(privateKey, keyStoreID);
    }

    /**
     * Import a private key, which is either already decrypted, or that can be decrypted with the given passphrase.
     * If a passphrase is given, but the key is already decrypted, importing fails.
     * Either `armoredKey` or `binaryKey` must be provided.
     * Note: if the passphrase to decrypt the key is unknown, the key shuld be imported using `importPublicKey` instead.
     * @param options.passphrase - key passphrase if the input key is encrypted, or `null` if the input key is expected to be already decrypted
     * @returns reference to imported private key
     * @throws {Error} if the key cannot be decrypted or importing fails
     */
    async importPrivateKey<T extends Data>(
        { armoredKey, binaryKey, passphrase, checkCompatibility }: WorkerImportPrivateKeyOptions<T>,
        _customIdx?: number
    ) {
        if (!armoredKey && !binaryKey) {
            throw new Error('Must provide `armoredKey` or `binaryKey`');
        }
        const expectDecrypted = passphrase === null;
        const maybeEncryptedKey = binaryKey
            ? await readPrivateKey({ binaryKey })
            : await readPrivateKey({ armoredKey: armoredKey! });
        if (checkCompatibility) {
            checkKeyCompatibility(maybeEncryptedKey);
        }
        let decryptedKey;
        if (expectDecrypted) {
            if (!maybeEncryptedKey.isDecrypted()) {
                throw new Error('Provide passphrase to import an encrypted private key');
            }
            decryptedKey = maybeEncryptedKey;
            // @ts-ignore missing .validate() types
            await decryptedKey.validate();
        } else {
            const usesArgon2 = maybeEncryptedKey.getKeys().some(
                // @ts-ignore s2k field not declared
                (keyOrSubkey) => keyOrSubkey.keyPacket.s2k && keyOrSubkey.keyPacket.s2k.type === 'argon2'
            );
            if (usesArgon2) {
                // TODO: Argon2 uses Wasm which requires special bundling
                throw new Error('Keys encrypted using Argon2 are not supported yet');
            }
            decryptedKey = await decryptKey({ privateKey: maybeEncryptedKey, passphrase });
        }

        const keyStoreID = this.keyStore.add(decryptedKey, _customIdx);

        return getPrivateKeyReference(decryptedKey, keyStoreID);
    }

    /**
     * Import a public key.
     * Either `armoredKey` or `binaryKey` must be provided.
     * Note: if a private key is given, it will be converted to a public key before import.
     * @returns reference to imported public key
     */
    async importPublicKey<T extends Data>(
        { armoredKey, binaryKey, checkCompatibility }: WorkerImportPublicKeyOptions<T>,
        _customIdx?: number
    ) {
        const publicKey = await getKey({ binaryKey, armoredKey });
        if (checkCompatibility) {
            checkKeyCompatibility(publicKey);
        }
        const keyStoreID = this.keyStore.add(publicKey, _customIdx);
        return getPublicKeyReference(publicKey, keyStoreID);
    }

    /**
     * Get the serialized public key.
     * Exporting a key does not invalidate the corresponding `KeyReference`, nor does it remove the key from internal storage (use `clearKey()` for that).
     * @param options.format - `'binary'` or `'armored'` format of serialized key
     * @returns serialized public key
     */
    async exportPublicKey<F extends SerialisedOutputFormat = 'armored'>({
        format = 'armored',
        key: keyReference,
    }: {
        key: KeyReference;
        format?: F;
    }): Promise<SerialisedOutputTypeFromFormat<F>> {
        const maybePrivateKey = this.keyStore.get(keyReference._idx);
        const publicKey = maybePrivateKey.isPrivate() ? maybePrivateKey.toPublic() : maybePrivateKey;
        const serializedKey = format === 'binary' ? publicKey.write() : publicKey.armor();
        return serializedKey as SerialisedOutputTypeFromFormat<F>;
    }

    /**
     * Get the serialized private key, encrypted with the given `passphrase`.
     * Exporting a key does not invalidate the corresponding `keyReference`, nor does it remove the key from internal storage (use `clearKey()` for that).
     * @param options.passphrase - passphrase to encrypt the key with (non-empty string), or `null` to export an unencrypted key (not recommended).
     * @param options.format - `'binary'` or `'armored'` format of serialized key
     * @returns serialized encrypted key
     */
    async exportPrivateKey<F extends SerialisedOutputFormat = 'armored'>({
        format = 'armored',
        ...options
    }: {
        privateKey: PrivateKeyReference;
        passphrase: string | null;
        format?: F;
    }): Promise<SerialisedOutputTypeFromFormat<F>> {
        const { privateKey: keyReference, passphrase } = options;
        if (!keyReference.isPrivate()) {
            throw new Error('Private key expected');
        }
        const privateKey = this.keyStore.get(keyReference._idx) as PrivateKey;
        const doNotEncrypt = passphrase === null;
        const maybeEncryptedKey = doNotEncrypt ? privateKey : await encryptKey({ privateKey, passphrase });

        const serializedKey = format === 'binary' ? maybeEncryptedKey.write() : maybeEncryptedKey.armor();
        return serializedKey as SerialisedOutputTypeFromFormat<F>;
    }
}

/**
 * Each instance keeps a dedicated key storage.
 */
export class Api extends KeyManagementApi {
    /**
     * Init pmcrypto and set the underlying global OpenPGP config.
     */
    static init() {
        initPmcrypto();
    }

    /**
     * Encrypt the given data using `encryptionKeys`, `sessionKeys` and `passwords`, after optionally
     * signing it with `signingKeys`.
     * Either `textData` or `binaryData` must be given.
     * A detached signature over the data may be provided by passing either `armoredSignature` or `binarySignature`.
     * @param options.textData - text data to encrypt
     * @param options.binaryData - binary data to encrypt
     * @param options.stripTrailingSpaces - whether trailing spaces should be removed from each line of `textData`
     * @param options.context - (signed data only) settings to prevent verifying the signature in a different context (signature domain separation)
     * @param options.format - `'binary` or `'armored'` format of serialized signed message
     * @param options.date - use the given date for the message signature, instead of the server time
     */
    async encryptMessage<
        DataType extends Data,
        FormatType extends WorkerEncryptOptions<DataType>['format'] = 'armored',
        DetachedType extends boolean = false,
    >({
        encryptionKeys: encryptionKeyRefs = [],
        signingKeys: signingKeyRefs = [],
        armoredSignature,
        binarySignature,
        compress = false,
        config = {},
        ...options
    }: WorkerEncryptOptions<DataType> & { format?: FormatType; detached?: DetachedType }) {
        const signingKeys = toArray(signingKeyRefs).map(
            (keyReference) => this.keyStore.get(keyReference._idx) as PrivateKey
        );
        const encryptionKeys = toArray(encryptionKeyRefs).map(
            (keyReference) => this.keyStore.get(keyReference._idx) as PublicKey
        );
        const inputSignature =
            binarySignature || armoredSignature ? await getSignature({ armoredSignature, binarySignature }) : undefined;

        if (config.preferredCompressionAlgorithm) {
            throw new Error(
                'Passing `config.preferredCompressionAlgorithm` is not supported. Use `compress` option instead.'
            );
        }

        const encryptionResult = await encryptMessage<DataType, FormatType, DetachedType>({
            ...options,
            // @ts-ignore probably issue with mismatching underlying stream definitions
            textData: options.textData,
            encryptionKeys,
            signingKeys,
            signature: inputSignature,
            config: {
                ...config,
                preferredCompressionAlgorithm: compress ? enums.compression.zlib : enums.compression.uncompressed,
            },
        });

        return encryptionResult;
    }

    /**
     * Create a signature over the given data using `signingKeys`.
     * Either `textData` or `binaryData` must be given.
     * @param options.textData - text data to sign
     * @param options.binaryData - binary data to sign
     * @param options.stripTrailingSpaces - whether trailing spaces should be removed from each line of `textData`
     * @param options.context - settings to prevent verifying the signature in a different context (signature domain separation)
     * @param options.detached - whether to return a detached signature, without the signed data
     * @param options.format - `'binary` or `'armored'` format of serialized signed message
     * @param options.date - use the given date for signing, instead of the server time
     * @returns serialized signed message or signature
     */
    async signMessage<
        DataType extends Data,
        FormatType extends WorkerSignOptions<DataType>['format'] = 'armored',
        // inferring D (detached signature type) is unnecessary since the result type does not depend on it for format !== 'object'
    >({ signingKeys: signingKeyRefs = [], ...options }: WorkerSignOptions<DataType> & { format?: FormatType }) {
        const signingKeys = toArray(signingKeyRefs).map(
            (keyReference) => this.keyStore.get(keyReference._idx) as PrivateKey
        );
        const signResult = await signMessage<DataType, FormatType, boolean>({
            ...options,
            // @ts-ignore probably issue with mismatching underlying stream definitions
            textData: options.textData,
            signingKeys,
        });

        return signResult;
    }

    /**
     * Verify a signature over the given data.
     * Either `armoredSignature` or `binarySignature` must be given for the signature, and either `textData` or `binaryData` must be given as data to be verified.
     * To verify a Cleartext message, which includes both the signed data and the corresponding signature, see `verifyCleartextMessage`.
     * @param options.textData - expected signed text data
     * @param options.binaryData - expected signed binary data
     * @param options.armoredSignature - armored signature to verify
     * @param options.binarySignature - binary signature to verify
     * @param options.stripTrailingSpaces - whether trailing spaces should be removed from each line of `textData`.
     *                                      This option must match the one used when signing.
     * @param options.context - settings to prevent verifying a signature from a different context (signature domain separation).
     *                          This option should match the one used when signing.
     * @returns signature verification result over the given data
     */
    async verifyMessage<DataType extends Data, FormatType extends WorkerVerifyOptions<DataType>['format'] = 'utf8'>({
        armoredSignature,
        binarySignature,
        verificationKeys: verificationKeyRefs = [],
        ...options
    }: WorkerVerifyOptions<DataType> & { format?: FormatType }) {
        const verificationKeys = toArray(verificationKeyRefs).map((keyReference) =>
            this.keyStore.get(keyReference._idx)
        );
        const signature = await getSignature({ armoredSignature, binarySignature });
        const {
            signatures: signatureObjects, // extracting this is needed for proper type inference of `serialisedResult.signatures`
            ...verificationResultWithoutSignatures
        } = await verifyMessage<DataType, FormatType>({ signature, verificationKeys, ...options });

        const serialisedResult = {
            ...verificationResultWithoutSignatures,
            signatures: signatureObjects.map((sig) => sig.write() as Uint8Array), // no support for streamed input for now
        };

        return serialisedResult;
    }

    /**
     * Verify a Cleartext message, which includes the signed data and the corresponding signature.
     * A cleartext message is always in armored form.
     * To verify a detached signature over some data, see `verifyMessage` instead.
     * @params options.armoredCleartextSignature - armored cleartext message to verify
     */
    async verifyCleartextMessage({
        armoredCleartextMessage,
        verificationKeys: verificationKeyRefs = [],
        ...options
    }: WorkerVerifyCleartextOptions) {
        const verificationKeys = toArray(verificationKeyRefs).map((keyReference) =>
            this.keyStore.get(keyReference._idx)
        );
        const cleartextMessage = await readCleartextMessage({ cleartextMessage: armoredCleartextMessage });
        const {
            signatures: signatureObjects, // extracting this is needed for proper type inference of `serialisedResult.signatures`
            ...verificationResultWithoutSignatures
        } = await verifyCleartextMessage({ cleartextMessage, verificationKeys, ...options });

        const serialisedResult = {
            ...verificationResultWithoutSignatures,
            signatures: signatureObjects.map((sig) => sig.write() as Uint8Array), // no support for streamed input for now
        };

        return serialisedResult;
    }

    /**
     * Decrypt a message using `decryptionKeys`, `sessionKey`, or `passwords`, and optionally verify the content using `verificationKeys`.
     * Eiher `armoredMessage` or `binaryMessage` must be given.
     * For detached signature verification over the decrypted data, one of `armoredSignature`,
     * `binarySignature`, `armoredEncryptedSignature` and `binaryEncryptedSignature` may be given.
     * @param options.armoredMessage - armored data to decrypt
     * @param options.binaryMessage - binary data to decrypt
     * @param options.expectSigned - if true, data decryption fails if the message is not signed with the provided `verificationKeys`
     * @param options.context - (signed data only) settings to prevent verifying a signature from a different context (signature domain separation).
     *                          This option should match the one used when encrypting.
     * @param options.format - whether to return data as a string or Uint8Array. If 'utf8' (the default), also normalize newlines.
     * @param options.date - use the given date for verification instead of the server time
     */
    async decryptMessage<FormatType extends WorkerDecryptionOptions['format'] = 'utf8'>({
        decryptionKeys: decryptionKeyRefs = [],
        verificationKeys: verificationKeyRefs = [],
        armoredMessage,
        binaryMessage,
        armoredSignature,
        binarySignature,
        armoredEncryptedSignature: armoredEncSignature,
        binaryEncryptedSignature: binaryEncSingature,
        ...options
    }: WorkerDecryptionOptions & { format?: FormatType }) {
        const decryptionKeys = toArray(decryptionKeyRefs).map(
            (keyReference) => this.keyStore.get(keyReference._idx) as PrivateKey
        );
        const verificationKeys = toArray(verificationKeyRefs).map((keyReference) =>
            this.keyStore.get(keyReference._idx)
        );

        const message = await getMessage({ binaryMessage, armoredMessage });
        const signature =
            binarySignature || armoredSignature ? await getSignature({ binarySignature, armoredSignature }) : undefined;
        const encryptedSignature =
            binaryEncSingature || armoredEncSignature
                ? await getMessage({ binaryMessage: binaryEncSingature, armoredMessage: armoredEncSignature })
                : undefined;

        const { signatures: signatureObjects, ...decryptionResultWithoutSignatures } = await decryptMessage<
            Data,
            FormatType
        >({
            ...options,
            message,
            signature,
            encryptedSignature,
            decryptionKeys,
            verificationKeys,
        });

        const serialisedResult = {
            ...decryptionResultWithoutSignatures,
            signatures: signatureObjects.map((sig) => sig.write() as Uint8Array), // no support for streamed input for now
        };

        return serialisedResult;

        // TODO: once we have support for the intendedRecipient verification, we should add the
        // a `verify(publicKeys)` function to the decryption result, that allows verifying
        // the decrypted signatures after decryption.
        // Note: asking the apps to call `verifyMessage` separately is not an option, since
        // the verification result is to be considered invalid outside of the encryption context if the intended recipient is present, see: https://datatracker.ietf.org/doc/html/draft-ietf-openpgp-crypto-refresh#section-5.2.3.32
    }

    /**
     * Generate forwardee key and proxy parameter needed to setup end-to-end encrypted forwarding for the given
     * privateKey.
     * @param options.forwarderPrivateKey - private key of original recipient, initiating the forwarding
     * @param options.userIDsForForwardeeKey - userIDs to attach to forwardee key
     * @param options.passphrase - passphrase to encrypt the generated forwardee key with
     * @param options.date - date to use as key creation time, instead of server time
     */
    async generateE2EEForwardingMaterial({
        forwarderKey,
        userIDsForForwardeeKey,
        passphrase,
        date,
    }: {
        forwarderKey: PrivateKeyReference;
        userIDsForForwardeeKey: MaybeArray<UserID>;
        passphrase: string | null;
        date?: Date;
    }) {
        const originalKey = this.keyStore.get(forwarderKey._idx) as PrivateKey;

        const { proxyInstances, forwardeeKey } = await generateForwardingMaterial(
            originalKey,
            userIDsForForwardeeKey,
            date
        );

        const maybeEncryptedKey = passphrase
            ? await encryptKey({ privateKey: forwardeeKey, passphrase })
            : forwardeeKey;

        return {
            forwardeeKey: maybeEncryptedKey.armor(),
            proxyInstances,
        };
    }

    /**
     * Check whether a key can be used as input to `generateE2EEForwardingMaterial` to setup E2EE forwarding.
     */
    async doesKeySupportE2EEForwarding({
        forwarderKey: keyReference,
        date,
    }: {
        forwarderKey: PrivateKeyReference;
        date?: Date;
    }) {
        const key = this.keyStore.get(keyReference._idx);
        if (!key.isPrivate()) {
            return false;
        }
        const supportsForwarding = await doesKeySupportForwarding(key, date);
        return supportsForwarding;
    }

    /**
     * Whether a key is a E2EE forwarding recipient key, where all its encryption-capable (sub)keys are setup
     * for forwarding.
     * NB: this function also accepts `PublicKeyReference`s in order to determine the status of inactive (undecryptable)
     * private keys. Such keys can only be imported using `importPublicKey`, but it's important that the encrypted
     * private key is imported (not the corresponding public key).
     * @throws if a PublicKeyReference containing a public key is given
     */
    async isE2EEForwardingKey({ key: keyReference, date }: { key: KeyReference; date?: Date }) {
        // We support PublicKeyReference to determine the status of inactive/undecryptable address keys.
        // A PublicKeyReference can contain an encrypted private key.
        const key = this.keyStore.get(keyReference._idx);
        if (!key.isPrivate()) {
            throw new Error('Unexpected public key');
        }
        const forForwarding = await isForwardingKey(key, date);
        return forForwarding;
    }

    /**
     * Generating a session key for the specified symmetric algorithm.
     * To generate a session key based on some recipient's public key preferences,
     * use `generateSessionKey()` instead.
     */
    async generateSessionKeyForAlgorithm(algoName: Parameters<typeof generateSessionKeyForAlgorithm>[0]) {
        const sessionKeyBytes = await generateSessionKeyForAlgorithm(algoName);
        return sessionKeyBytes;
    }

    /**
     * Generate a session key compatible with the given recipient keys.
     * To get a session key for a specific symmetric algorithm, use `generateSessionKeyForAlgorithm` instead.
     */
    async generateSessionKey({ recipientKeys: recipientKeyRefs = [], ...options }: WorkerGenerateSessionKeyOptions) {
        const recipientKeys = toArray(recipientKeyRefs).map((keyReference) => this.keyStore.get(keyReference._idx));
        const sessionKey = await generateSessionKey({ recipientKeys, ...options });
        return sessionKey as SessionKeyWithoutPlaintextAlgo;
    }

    /**
     * Encrypt a session key with `encryptionKeys`, `passwords`, or both at once.
     * At least one of `encryptionKeys` or `passwords` must be specified.
     * @param options.data - the session key to be encrypted e.g. 16 random bytes (for aes128)
     * @param options.algorithm - algorithm of the session key
     * @param options.aeadAlgorithm - AEAD algorithm of the session key
     * @param options.format - `'armored'` or `'binary'` format of the returned encrypted message
     * @param options.wildcard - use a key ID of 0 instead of the encryption key IDs
     * @param options.date - use the given date for key validity checks, instead of the server time
     */
    async encryptSessionKey<FormatType extends WorkerEncryptSessionKeyOptions['format'] = 'armored'>({
        encryptionKeys: encryptionKeyRefs = [],
        ...options
    }: WorkerEncryptSessionKeyOptions & { format?: FormatType }): Promise<SerialisedOutputTypeFromFormat<FormatType>> {
        const encryptionKeys = toArray(encryptionKeyRefs).map(
            (keyReference) => this.keyStore.get(keyReference._idx) as PublicKey
        );
        const encryptedData = await encryptSessionKey<FormatType>({
            ...options,
            encryptionKeys,
        });

        return encryptedData as SerialisedOutputTypeFromFormat<FormatType>;
    }

    /**
     * Decrypt the message's session keys using either `decryptionKeys` or `passwords`.
     * Either `armoredMessage` or `binaryMessage` must be given.
     * @param options.armoredMessage - an armored message containing encrypted session key packets
     * @param options.binaryMessage - a binary message containing encrypted session key packets
     * @param options.date - date to use for key validity checks instead of the server time
     * @throws if no session key could be found or decrypted
     */
    async decryptSessionKey({
        decryptionKeys: decryptionKeyRefs = [],
        armoredMessage,
        binaryMessage,
        ...options
    }: WorkerDecryptionOptions) {
        const decryptionKeys = toArray(decryptionKeyRefs).map(
            (keyReference) => this.keyStore.get(keyReference._idx) as PrivateKey
        );

        const message = await getMessage({ binaryMessage, armoredMessage });

        const sessionKey = await decryptSessionKey({
            ...options,
            message,
            decryptionKeys,
        });

        return sessionKey as SessionKeyWithoutPlaintextAlgo;
    }

    async processMIME({ verificationKeys: verificationKeyRefs = [], ...options }: WorkerProcessMIMEOptions) {
        const verificationKeys = toArray(verificationKeyRefs).map((keyReference) =>
            this.keyStore.get(keyReference._idx)
        );

        const { signatures: signatureObjects, ...resultWithoutSignature } = await processMIME({
            ...options,
            verificationKeys,
        });

        const serialisedResult = {
            ...resultWithoutSignature,
            signatures: signatureObjects.map((sig) => sig.write() as Uint8Array),
        };
        return serialisedResult;
    }

    async getMessageInfo<DataType extends Data>({
        armoredMessage,
        binaryMessage,
    }: WorkerGetMessageInfoOptions<DataType>): Promise<MessageInfo> {
        const message = await getMessage({ binaryMessage, armoredMessage });
        const signingKeyIDs = message.getSigningKeyIDs().map((keyID) => keyID.toHex());
        const encryptionKeyIDs = message.getEncryptionKeyIDs().map((keyID) => keyID.toHex());

        return { signingKeyIDs, encryptionKeyIDs };
    }

    async getSignatureInfo<DataType extends Data>({
        armoredSignature,
        binarySignature,
    }: WorkerGetSignatureInfoOptions<DataType>): Promise<SignatureInfo> {
        const signature = await getSignature({ binarySignature, armoredSignature });
        const signingKeyIDs = signature.getSigningKeyIDs().map((keyID) => keyID.toHex());

        return { signingKeyIDs };
    }

    /**
     * Get basic info about a serialied key without importing it in the key store.
     * E.g. determine whether the given key is private, and whether it is decrypted.
     */
    async getKeyInfo<T extends Data>({ armoredKey, binaryKey }: WorkerGetKeyInfoOptions<T>): Promise<KeyInfo> {
        const key = await getKey({ binaryKey, armoredKey });
        const keyIsPrivate = key.isPrivate();
        const keyIsDecrypted = keyIsPrivate ? key.isDecrypted() : null;
        const fingerprint = key.getFingerprint();
        const keyIDs = key.getKeyIDs().map((keyID) => keyID.toHex());

        return {
            keyIsPrivate,
            keyIsDecrypted,
            fingerprint,
            keyIDs,
        };
    }

    /**
     * Armor a message signature in binary form
     */
    async getArmoredSignature({ binarySignature }: { binarySignature: Uint8Array }) {
        const signature = await getSignature({ binarySignature });
        return signature.armor();
    }

    /**
     * Armor a message given in binary form
     */
    async getArmoredMessage({ binaryMessage }: { binaryMessage: Uint8Array }) {
        const armoredMessage = await armorBytes(binaryMessage);
        return armoredMessage;
    }

    /**
     * Given one or more keys concatenated in binary format, get the corresponding keys in armored format.
     * The keys are not imported into the key store nor processed further. Both private and public keys are supported.
     * @returns array of armored keys
     */
    async getArmoredKeys({ binaryKeys }: { binaryKeys: Uint8Array }) {
        const keys = await readKeys({ binaryKeys });
        return keys.map((key) => key.armor());
    }

    /**
     * Returns whether the primary key is revoked.
     * @param options.date - date to use for signature verification, instead of the server time
     */
    async isRevokedKey({ key: keyReference, date }: { key: KeyReference; date?: Date }) {
        const key = this.keyStore.get(keyReference._idx);
        const isRevoked = await isRevokedKey(key, date);
        return isRevoked;
    }

    /**
     * Returns whether the primary key is expired, or its creation time is in the future.
     * @param options.date - date to use for the expiration check, instead of the server time
     */
    async isExpiredKey({ key: keyReference, date }: { key: KeyReference; date?: Date }) {
        const key = this.keyStore.get(keyReference._idx);
        const isExpired = await isExpiredKey(key, date);
        return isExpired;
    }

    /**
     * Check whether a key can successfully encrypt a message.
     * This confirms that the key has encryption capabilities, it is neither expired nor revoked, and that its key material is valid.
     */
    async canKeyEncrypt({ key: keyReference, date }: { key: KeyReference; date?: Date }) {
        const key = this.keyStore.get(keyReference._idx);
        const canEncrypt = await canKeyEncrypt(key, date);
        return canEncrypt;
    }

    async getSHA256Fingerprints({ key: keyReference }: { key: KeyReference }) {
        const key = this.keyStore.get(keyReference._idx);
        // this is quite slow since it hashes the key packets, even for v5 keys, instead of reusing the fingerprint.
        // once v5 keys are more widespread and this function can be made more efficient, we could include `sha256Fingerprings` in `KeyReference` or `KeyInfo`.
        const sha256Fingerprints = await getSHA256Fingerprints(key);
        return sha256Fingerprints;
    }

    async computeHash({
        algorithm,
        data,
    }: {
        algorithm: 'unsafeMD5' | 'unsafeSHA1' | 'SHA512' | 'SHA256';
        data: Uint8Array;
    }) {
        let hash;
        switch (algorithm) {
            case 'SHA512':
                hash = await SHA512(data);
                return hash;
            case 'SHA256':
                hash = await SHA256(data);
                return hash;
            case 'unsafeSHA1':
                hash = await unsafeSHA1(data);
                return hash;
            case 'unsafeMD5':
                hash = await unsafeMD5(data);
                return hash;
            default:
                throw new Error(`Unsupported algorithm: ${algorithm}`);
        }
    }

    // this function may be merged with `computeHash` once we add streaming support to all/most hash algos
    async computeHashStream({ algorithm, dataStream }: ComputeHashStreamOptions) {
        let hashStream;
        switch (algorithm) {
            case 'unsafeSHA1':
                hashStream = await unsafeSHA1(dataStream);
                return hashStream;
            default:
                throw new Error(`Unsupported algorithm: ${algorithm}`);
        }
    }

    /**
     * Compute argon2 key derivation of the given `password`
     */
    async computeArgon2({ password, salt, params = ARGON2_PARAMS.RECOMMENDED }: Argon2Options) {
        const result = await argon2({ password, salt, params });
        return result;
    }

    /**
     * Replace the User IDs of the target key to match those of the source key.
     * NOTE: this function mutates the target key in place, and does not update binding signatures.
     */
    async replaceUserIDs({
        sourceKey: sourceKeyReference,
        targetKey: targetKeyReference,
    }: {
        sourceKey: KeyReference;
        targetKey: PrivateKeyReference;
    }) {
        const sourceKey = this.keyStore.get(sourceKeyReference._idx);
        const targetKey = this.keyStore.get(targetKeyReference._idx);
        if (targetKey.getFingerprint() !== sourceKey.getFingerprint()) {
            throw new Error('Cannot replace UserIDs of a different key');
        }

        targetKey.users = sourceKey.users.map((sourceUser) => {
            // @ts-ignore missing .clone() definition
            const destUser = sourceUser.clone();
            destUser.mainKey = targetKey;
            return destUser;
        });
    }

    /**
     * Return a new key reference with changed userIDs.
     * Aside from the userIDs, the two keys are identical (e.g. same binding signatures).
     * The original key is not modified.
     */
    async cloneKeyAndChangeUserIDs({
        privateKey: privateKeyRef,
        userIDs,
    }: {
        privateKey: PrivateKeyReference;
        userIDs: MaybeArray<UserID>;
    }) {
        const originalKey = this.keyStore.get(privateKeyRef._idx) as PrivateKey;

        // @ts-ignore missing clone declaration
        const updatedKey: PrivateKey = originalKey.clone(true);

        // To preserve the original key signatures that are not involved with userIDs,
        // we first reformat the key to add & sign the new userIDs, then replace the userIDs of the original key.
        // To improve reformatting performance, we can drop subkeys beforehand, as they are not needed for the UserID
        const updatedSubkeys = updatedKey.subkeys;
        // NB: the private key params of the returned reformatted keys point to the same ones as `updatedKey`.
        // Hence, they will be cleared once the corresponding ref is cleared by the app -- no need to clear them now.
        const { publicKey: temporaryKeyWithNewUsers } = await reformatKey({
            privateKey: updatedKey,
            userIDs,
            format: 'object',
        });
        updatedKey.subkeys = updatedSubkeys;

        // same process as `updateUserIDs`
        updatedKey.users = temporaryKeyWithNewUsers.users.map((newUser) => {
            // @ts-ignore missing .clone() definition
            const destUser = newUser.clone();
            destUser.mainKey = updatedKey;
            return destUser;
        });

        const keyStoreID = this.keyStore.add(updatedKey);
        return getPrivateKeyReference(updatedKey, keyStoreID);
    }
}

export interface ApiInterface extends Omit<Api, 'keyStore'> {}
