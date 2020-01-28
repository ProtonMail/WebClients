declare module 'pmcrypto' {
    import { DecryptOptions, DecryptResult, message, key, type, signature, packet, enums } from 'openpgp';

    export type PmcryptoKey = key.Key;

    export interface SessionKey {
        data: Uint8Array;
        algorithm: string;
    }

    export interface DecryptLecacyOptions extends DecryptOptions {
        messageDate?: Date;
    }

    export interface DecryptMimeOptions extends DecryptLecacyOptions {
        headerFilename?: string;
        sender?: string;
    }

    // No message in pmcrypto options so no reuse the OpenPGP's equivalent
    export interface EncryptOptions {
        data: Uint8Array | string;
        publicKeys?: PmcryptoKey[];
        privateKeys?: PmcryptoKey[];
        sessionKey?: SessionKey;
        armor?: boolean;
        detached?: boolean;
        filename?: string;
        format?: string;
        compression?: boolean;
        returnSessionKey?: boolean;
    }

    // No reuse from OpenPGP's equivalent
    export interface EncryptResult {
        data: string;
        message: message.Message;
        signature: signature.Signature;
        sessionKey: SessionKey;
    }

    export interface BinaryResult {
        data: Uint8Array;
        filename?: string;
        signatures?: {
            keyid: type.keyid.Keyid;
            verified: Promise<boolean>;
            valid: boolean;
        }[];
    }

    export function encodeUtf8(str: string | undefined): string | undefined;
    export function encodeBase64(str: string | undefined): string | undefined;
    export function decodeBase64(str: string | undefined): string | undefined;
    export function encodeUtf8Base64(str: string | undefined): string | undefined;
    export function decodeUtf8Base64(str: string | undefined): string | undefined;

    export function binaryStringToArray(str: string): Uint8Array;
    export function arrayToBinaryString(bytes: Uint8Array): string;
    export function arrayToHexString(bytes: Uint8Array): string;
    export function concatArrays(data: Uint8Array[]): Uint8Array;

    export function getKeys(key: Uint8Array | string): Promise<PmcryptoKey[]>;
    export function getFingerprint(key: PmcryptoKey): string;
    export function isExpiredKey(key: PmcryptoKey): Promise<boolean>;

    export function generateSessionKey(algo: string): Uint8Array;
    export function encryptSessionKey(options: {
        data: Uint8Array;
        algorithm: string;
        aeadAlgo?: string;
        publicKeys?: any[];
        passwords?: any[];
        wildcard?: boolean;
        date?: Date;
        userIds?: any[];
    }): Promise<{ message: message.Message }>;

    export function decryptSessionKey(options: {
        message: message.Message;
        privateKeys?: key.Key | key.Key[];
        passwords?: string | string[];
    }): Promise<{ data: Uint8Array; algorithm: string } | undefined>;

    export function decryptMessage(options: DecryptOptions): DecryptResult;
    export function decryptMessageLegacy(options: DecryptLecacyOptions): DecryptResult;
    export function decryptMIMEMessage(
        options: DecryptMimeOptions
    ): {
        getBody: () => Promise<{ body: string; mimetype: string } | undefined>;
        getAttachments: () => Promise<any>;
        getEncryptedSubject: () => Promise<string>;
        verify: () => Promise<number>;
    };

    export function encryptMessage(options: EncryptOptions): Promise<EncryptResult>;

    export function getMessage(
        message: message.Message | Uint8Array | string
    ): message.Message | Promise<message.Message>;

    export function splitMessage(
        message: message.Message | Uint8Array | string
    ): Promise<{
        asymmetric: Uint8Array[];
        signature: Uint8Array[];
        symmetric: Uint8Array[];
        compressed: Uint8Array[];
        literal: Uint8Array[];
        encrypted: Uint8Array[];
        other: Uint8Array[];
    }>;

    export function armorBytes(value: Uint8Array | string): Promise<Uint8Array | string>;
}
