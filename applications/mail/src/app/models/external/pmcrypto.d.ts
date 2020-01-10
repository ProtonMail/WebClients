declare module 'pmcrypto' {
    import { DecryptOptions, DecryptResult, message, key, type } from 'openpgp';

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

    export function decryptSessionKey(options: {
        message: message.Message;
        privateKeys?: key.Key | key.Key[];
        passwords?: string | string[];
    }): Promise<{ data: Uint8Array; algorithm: string } | undefined>;

    export function getMessage(
        message: message.Message | Uint8Array | string
    ): message.Message | Promise<message.Message>;

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
}
