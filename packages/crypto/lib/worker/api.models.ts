import type {
    AlgorithmInfo,
    ContextSigningOptions,
    ContextVerificationOptions,
    Data,
    DecryptOptionsPmcrypto,
    DecryptResultPmcrypto,
    DecryptSessionKeyOptionsPmcrypto,
    EncryptOptionsPmcrypto,
    EncryptSessionKeyOptionsPmcrypto,
    GenerateKeyOptions,
    GenerateSessionKeyOptionsPmcrypto,
    MIMEAttachment,
    ProcessMIMEOptions,
    ProcessMIMEResult,
    ReformatKeyOptions,
    SessionKey,
    SignOptionsPmcrypto,
    VerifyCleartextOptionsPmcrypto,
    VerifyMessageResult,
    VerifyOptionsPmcrypto,
} from 'pmcrypto';
import type { PartialConfig, enums } from 'pmcrypto/lib/openpgp';

import type { KeyCompatibilityLevel } from '../constants';

export type MaybeArray<T> = T[] | T;
export type { enums, SessionKey, AlgorithmInfo, MIMEAttachment, ContextSigningOptions, ContextVerificationOptions };

export interface InitOptions {}

// TODO TS: do not allow mutually exclusive properties
export interface WorkerDecryptionOptions
    extends Omit<
        DecryptOptionsPmcrypto<Data>,
        'message' | 'signature' | 'encryptedSignature' | 'verificationKeys' | 'decryptionKeys'
    > {
    armoredSignature?: string;
    binarySignature?: Uint8Array<ArrayBuffer>;
    armoredMessage?: string;
    binaryMessage?: Uint8Array<ArrayBuffer>;
    armoredEncryptedSignature?: string;
    binaryEncryptedSignature?: Uint8Array<ArrayBuffer>;
    verificationKeys?: MaybeArray<PublicKeyReference>;
    decryptionKeys?: MaybeArray<PrivateKeyReference>;
    sessionKeys?: MaybeArray<SessionKey>;
    config?: PartialConfig;
}
export interface WorkerDecryptionResult<T extends Data> extends Omit<DecryptResultPmcrypto<T>, 'signatures'> {
    signatures: Uint8Array<ArrayBuffer>[];
}

// TODO to make Option interfaces easy to use for the user, might be best to set default param types (e.g. T extends Data = Data).
export interface WorkerVerifyOptions<T extends Data>
    extends Omit<VerifyOptionsPmcrypto<T>, 'signature' | 'verificationKeys'> {
    armoredSignature?: string;
    binarySignature?: Uint8Array<ArrayBuffer>;
    verificationKeys: MaybeArray<PublicKeyReference>;
    config?: PartialConfig;
}
export interface WorkerVerifyCleartextOptions
    extends Omit<VerifyCleartextOptionsPmcrypto, 'cleartextMessage' | 'verificationKeys'> {
    armoredCleartextMessage: string;
    verificationKeys: MaybeArray<PublicKeyReference>;
    config?: PartialConfig;
}
export interface WorkerVerificationResult<T extends Data = Data> extends Omit<VerifyMessageResult<T>, 'signatures'> {
    signatures: Uint8Array<ArrayBuffer>[];
}

export interface WorkerSignOptions<T extends Data> extends Omit<SignOptionsPmcrypto<T>, 'signingKeys'> {
    format?: 'armored' | 'binary';
    signingKeys?: MaybeArray<PrivateKeyReference>;
}
export interface WorkerEncryptOptions<T extends Data>
    extends Omit<EncryptOptionsPmcrypto<T>, 'signature' | 'signingKeys' | 'encryptionKeys'> {
    format?: 'armored' | 'binary';
    armoredSignature?: string;
    binarySignature?: Uint8Array<ArrayBuffer>;
    encryptionKeys?: MaybeArray<PublicKeyReference>;
    signingKeys?: MaybeArray<PrivateKeyReference>;
    compress?: boolean;
    config?: PartialConfig;
}

export interface WorkerProcessMIMEOptions extends Omit<ProcessMIMEOptions, 'verificationKeys'> {
    verificationKeys?: MaybeArray<PublicKeyReference>;
}

export interface WorkerProcessMIMEResult extends Omit<ProcessMIMEResult, 'signatures'> {
    signatures: Uint8Array<ArrayBuffer>[];
}

export type WorkerExportedKey<F extends 'armored' | 'binary' | undefined = 'armored'> = F extends 'armored'
    ? string
    : Uint8Array<ArrayBuffer>;

export interface WorkerImportDecryptedPrivateKeyOptions<T extends Data> {
    armoredKey?: T extends string ? T : never;
    binaryKey?: T extends Uint8Array<ArrayBuffer> ? T : never;
}

export interface WorkerImportEncryptedPrivateKeyOptions<T extends Data> {
    armoredKey?: T extends string ? T : never;
    binaryKey?: T extends Uint8Array<ArrayBuffer> ? T : never;
    passphrase: string;
}

export interface WorkerImportPrivateKeyOptions<T extends Data> {
    armoredKey?: T extends string ? T : never;
    binaryKey?: T extends Uint8Array<ArrayBuffer> ? T : never;
    /**
     * null if the key is expected to be already decrypted, e.g. when user uploads a new private key that is unencrypted
     */
    passphrase: string | null;
    /**
     * Check whether the key is compatible with all Proton clients.
     * This should be used when importing a key that was generate outside of Proton.
     */
    checkCompatibility?: KeyCompatibilityLevel;
}

export type WorkerImportPublicKeyOptions<T extends Data> = {
    armoredKey?: T extends string ? T : never;
    binaryKey?: T extends Uint8Array<ArrayBuffer> ? T : never;
    /**
     * Check whether the key is compatible with all Proton clients.
     * This should be used when importing a key that was generate outside of Proton.
     */
    checkCompatibility?: KeyCompatibilityLevel;
};

export interface WorkerGenerateKeyOptions<CustomConfig extends PartialConfig | undefined>
    extends Omit<GenerateKeyOptions, 'format' | 'passphrase'> {
    config?: CustomConfig; // parametrized for key version inference
}

export interface WorkerReformatKeyOptions extends Omit<ReformatKeyOptions, 'privateKey' | 'format' | 'passphrase'> {
    privateKey: PrivateKeyReference;
}

export interface WorkerEncryptSessionKeyOptions extends Omit<EncryptSessionKeyOptionsPmcrypto, 'encryptionKeys'> {
    algorithm: SessionKey['algorithm'];
    format?: 'armored' | 'binary';
    encryptionKeys?: MaybeArray<PublicKeyReference>;
}

export interface WorkerGenerateSessionKeyOptions extends Omit<GenerateSessionKeyOptionsPmcrypto, 'recipientKeys'> {
    recipientKeys?: MaybeArray<PublicKeyReference>;
}

export interface WorkerDecryptSessionKeyOptions
    extends Omit<DecryptSessionKeyOptionsPmcrypto, 'message' | 'decryptionKeys'> {
    armoredMessage?: string;
    binaryMessage?: Uint8Array<ArrayBuffer>;
    decryptionKeys?: MaybeArray<PrivateKeyReference>;
}

export interface WorkerGetMessageInfoOptions<T extends Data> {
    armoredMessage?: T extends string ? T : never;
    binaryMessage?: T extends Uint8Array<ArrayBuffer> ? T : never;
}

export interface MessageInfo {
    signingKeyIDs: KeyID[];
    encryptionKeyIDs: KeyID[];
}

export interface WorkerGetSignatureInfoOptions<T extends Data> {
    armoredSignature?: T extends string ? T : never;
    binarySignature?: T extends Uint8Array<ArrayBuffer> ? T : never;
}

export interface WorkerGetKeyInfoOptions<T extends Data> {
    armoredKey?: T extends string ? T : never;
    binaryKey?: T extends Uint8Array<ArrayBuffer> ? T : never;
}

export interface SignatureInfo {
    signingKeyIDs: KeyID[];
}

export interface KeyInfo {
    keyIsPrivate: boolean;
    /**
     * Whether the key is decrypted, or `null` for public keys
     */
    keyIsDecrypted: boolean | null;
    fingerprint: string;
    /**
     * Key IDs of primary key and subkeys in hex format
     */
    keyIDs: KeyID[];
}

export type KeyID = string;

export interface KeyReference {
    /** Internal unique key identifier for the key store */
    readonly _idx: any;
    /**
     * (Internal) key content identifier to determine equality.
     * First entry includes the full key.
     * Second entry does not include 3rd party certifications (e.g. from Proton CA).
     **/
    readonly _keyContentHash: [string, string];

    getVersion(): number;
    /**
     * Get primary key hex fingerprint (size depends on key version).
     */
    getFingerprint(): string;
    /**
     * Get list of SHA256 fingerprints for primary key and subkeys in hex format.
     * This is needed for specific use-cases, e.g. SKLs.
     * If in doubt, you should probably use `getFingerprint()` instead.
     */
    getSHA256Fingerprints(): string[];
    /**
     * Key ID of primary key in hex format.
     */
    getKeyID(): KeyID;
    /**
     * Key IDs of primary key and subkeys in hex format
     */
    getKeyIDs(): KeyID[];
    getAlgorithmInfo(): AlgorithmInfo;
    getCreationTime(): Date;
    isPrivate: () => this is PrivateKeyReference;
    isPrivateKeyV4: () => this is PrivateKeyReferenceV4; // to be replaced with helper function in @proton/crypto once a PublicKey equivalent is needed
    isPrivateKeyV6: () => this is PrivateKeyReferenceV6;
    getExpirationTime(): Date | number | null;
    getUserIDs(): string[];
    /**
     * Whether the primary key or the subkeys fail to meet our recommended security level.
     * A key is considered secure (i.e. not weak) if it is:
     * - RSA of size >= 2047 bits
     * - ECC using curve 25519 or any of the NIST curves
     */
    isWeak(): boolean;
    /**
     * Compare public key content. Keys are considered equal if they have same key and subkey material,
     * as well as same certification signatures, namely same expiration time, capabilities, algorithm preferences etc.
     * @param [ignoreOtherCerts] - whether third-party certifications (e.g. from Proton CA) should be ignored.
     */
    equals(otherKey: KeyReference, ignoreOtherCerts?: boolean): boolean;
    subkeys: {
        getAlgorithmInfo(): AlgorithmInfo;
        getKeyID(): KeyID;
    }[];
}
export interface PublicKeyReference extends KeyReference {}
export interface PrivateKeyReference extends PublicKeyReference {
    /** Dummy field needed to distinguish a PrivateKeyReference from  a PublicKeyReference, as they are otherwise seen as equivalent by TS */
    readonly _dummyType: 'private';
}
export interface PrivateKeyReferenceV4 extends PrivateKeyReference {
    getVersion(): 4;
}
export interface PrivateKeyReferenceV6 extends PrivateKeyReference {
    getVersion(): 6;
}

export interface ComputeHashStreamOptions {
    algorithm: 'unsafeSHA1';
    dataStream: ReadableStream<Uint8Array<ArrayBuffer>>;
}
