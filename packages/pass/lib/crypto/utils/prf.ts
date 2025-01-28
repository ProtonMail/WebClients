import { arrayToBinaryString } from '@proton/crypto/lib/utils';
import type { Maybe } from '@proton/pass/types/utils';

import { PassCryptoError } from './errors';

// Add webauthn properties missing from PublicKeyCredentialCreationOptions
type ExtendedPublicKeyCredentialOptions = PublicKeyCredentialCreationOptions & {
    hints: ('client-device' | 'security-key' | 'hybrid')[];
};

const firstSalt = new Uint8Array(new Array(32).fill(1)).buffer;

export async function deriveKeyFromPRFCredential(credential: PublicKeyCredential, exported: true): Promise<string>;
export async function deriveKeyFromPRFCredential(credential: PublicKeyCredential): Promise<CryptoKey>;
export async function deriveKeyFromPRFCredential(credential: PublicKeyCredential, exported: boolean = false) {
    const extensions = credential.getClientExtensionResults();
    const prfBuffer = extensions.prf?.results?.first as Maybe<ArrayBuffer>;
    if (!prfBuffer) throw new PassCryptoError('Could not generate PRF bytes');

    const inputKeyMaterial = new Uint8Array(prfBuffer);

    const keyDerivationKey = await crypto.subtle.importKey('raw', inputKeyMaterial, 'HKDF', false, ['deriveKey']);

    const key = await crypto.subtle.deriveKey(
        { name: 'HKDF', hash: 'SHA-256', info: new Uint8Array(), salt: new Uint8Array() },
        keyDerivationKey,
        { name: 'AES-GCM', length: 256 },
        exported,
        ['encrypt', 'decrypt']
    );

    if (exported) {
        const exported = await crypto.subtle.exportKey('raw', key);
        return arrayToBinaryString(new Uint8Array(exported));
    }

    return key;
}

export async function getSerializedCredential(credentialId: Uint8Array) {
    const credential = (await navigator.credentials.get({
        mediation: 'required',
        publicKey: {
            challenge: new Uint8Array([1]),
            allowCredentials: [
                {
                    type: 'public-key',
                    id: credentialId,
                    transports: ['internal'],
                },
            ],
            userVerification: 'required',
            timeout: 30_000,
            extensions: {
                prf: {
                    eval: {
                        first: firstSalt,
                    },
                },
            },
        },
    })) as PublicKeyCredential;

    const serializedKey = await deriveKeyFromPRFCredential(credential, true);

    return serializedKey;
}

export async function generateCredential(user: PublicKeyCredentialUserEntity): Promise<PublicKeyCredential> {
    const credential = (await navigator.credentials.create({
        publicKey: {
            rp: {
                name: window.location.hostname,
                id: window.location.hostname,
            },
            user,
            challenge: new Uint8Array([1]),
            pubKeyCredParams: [
                {
                    type: 'public-key',
                    alg: -7,
                },
                {
                    type: 'public-key',
                    alg: -257,
                },
            ],
            timeout: 60000,
            excludeCredentials: [],
            authenticatorSelection: {
                authenticatorAttachment: 'platform',
                residentKey: 'required',
                requireResidentKey: true,
                userVerification: 'required',
            },
            hints: ['client-device'],
            attestation: 'direct',
            extensions: {
                prf: {
                    eval: {
                        first: firstSalt,
                    },
                },
            },
        } as ExtendedPublicKeyCredentialOptions,
    })) as PublicKeyCredential;

    return credential;
}
