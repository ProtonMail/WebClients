import { v4 as uuidv4 } from 'uuid';

import { CryptoProxy } from '@proton/crypto/lib';
import { exportKey, generateKey, importKey } from '@proton/crypto/lib/subtle/aesGcm';

import { encryptUint8Array } from '../../../crypto';
import { decryptString, decryptUint8Array, encryptString } from './encryption';
import type { AesGcmCryptoKey, Base64, RequestId } from './types';

/**
 * Generate a new request ID for encryption
 */
export function generateRequestId(): RequestId {
    return uuidv4();
}

/**
 * Generate a new AES-GCM encryption key
 */
export async function generateRequestKey(): Promise<AesGcmCryptoKey> {
    const rawBytes = generateKey();
    const key = await importKey(rawBytes, { extractable: true });
    return {
        type: 'AesGcmCryptoKey',
        encryptKey: key,
    };
}

export class RequestEncryptionParams {
    public requestKey: AesGcmCryptoKey;
    public requestId: string;
    private requestAd: string;
    private responseAd: string;

    constructor(requestKey: AesGcmCryptoKey, requestId: string) {
        this.requestKey = requestKey;
        this.requestId = requestId;
        this.requestAd = RequestEncryptionParams.getRequestAd(this.requestId);
        this.responseAd = RequestEncryptionParams.getResponseAd(this.requestId);
    }

    public static async create(
        requestKey: AesGcmCryptoKey | undefined,
        requestId: string | undefined,
        options: { enableU2LEncryption?: boolean; autoGenerateEncryption?: boolean } = {}
    ): Promise<RequestEncryptionParams | null> {
        const { enableU2LEncryption, autoGenerateEncryption } = options;
        if (!enableU2LEncryption) {
            return null;
        }
        if (requestKey && !requestId) {
            throw new Error('Request key was provided without a request id. Both are necessary for AEAD.');
        }
        if (!requestKey && requestId) {
            throw new Error('Request id was provided without a request key. Both are necessary for AEAD.');
        }
        if (requestKey && requestId) {
            return new RequestEncryptionParams(requestKey, requestId);
        }
        console.assert(!requestKey && !requestId);
        if (!autoGenerateEncryption) {
            return null;
        }
        return new RequestEncryptionParams(await generateRequestKey(), generateRequestId());
    }

    /**
     * Prepare encrypted request key for transmission
     */
    public async encryptRequestKey(lumoPubKey: string): Promise<Base64> {
        const lumoPublicKey = await CryptoProxy.importPublicKey({ armoredKey: lumoPubKey });
        const requestKeyBin = await exportKey(this.requestKey.encryptKey);
        const requestKeyEnc = await CryptoProxy.encryptMessage({
            binaryData: requestKeyBin,
            encryptionKeys: lumoPublicKey,
            format: 'binary',
        });
        return requestKeyEnc.message.toBase64();
    }

    /**
     * Encrypt a string with these encryption parameters
     */
    public async encryptString(s: string): Promise<Base64> {
        return encryptString(s, this.requestKey, this.requestAd);
    }

    /**
     * Encrypt bytes with these encryption parameters
     */
    public async encryptUint8Array(s: Uint8Array<ArrayBuffer>): Promise<Base64> {
        return encryptUint8Array(s, this.requestKey, this.requestAd);
    }

    /**
     * Decrypt base64-encoded data into a string with these encryption parameters
     */
    public async decryptString(encryptedBase64: Base64): Promise<Base64> {
        return decryptString(encryptedBase64, this.requestKey, this.responseAd);
    }

    /**
     * Decrypt base64-encoded data into raw bytes with these encryption parameters
     */
    public async decryptUint8Array(encryptedBase64: Base64): Promise<Uint8Array<ArrayBuffer>> {
        return decryptUint8Array(encryptedBase64, this.requestKey, this.responseAd);
    }

    /**
     * Compute the request Associated Data string associated to this request ID.
     * This is the only purpose of the request ID: to construct AD strings for AEAD encryption,
     * which prevents some substitution attacks.
     * The request ID is only used for this purpose and nothing else.
     */
    public static getRequestAd(requestId: string) {
        return `lumo.request.${requestId}.turn`;
    }

    /**
     * Compute the response Associated Data string associated to this request ID.
     * This is the only purpose of the request ID: to construct AD strings for AEAD encryption,
     * which prevents some substitution attacks.
     * The request ID is only used for this purpose and nothing else.
     */
    public static getResponseAd(requestId: string) {
        return `lumo.response.${requestId}.chunk`;
    }
}
