import { deriveKey } from '@proton/crypto/lib/subtle/aesGcm';
import { arrayToBinaryString } from '@proton/crypto/lib/utils';
import type { Maybe } from '@proton/pass/types/utils';

import { PassCryptoError } from './errors';

type ExtendedPublicKeyCredentialOptions = PublicKeyCredentialCreationOptions & {
    hints?: ('client-device' | 'security-key' | 'hybrid')[];
};

const FIRST_SALT = Uint8Array.from('proton.pass.webauthn.prf.firstSalt').buffer;
const HKDF_INFO = Uint8Array.from('me.proton.pass.webauthn');

export async function deriveKeyFromPRFCredential(credential: PublicKeyCredential, exported: true): Promise<string>;
export async function deriveKeyFromPRFCredential(credential: PublicKeyCredential): Promise<CryptoKey>;
export async function deriveKeyFromPRFCredential(credential: PublicKeyCredential, exported: boolean = false) {
    const extensions = credential.getClientExtensionResults();
    const prfBuffer = extensions.prf?.results?.first as Maybe<ArrayBuffer>;
    if (!prfBuffer) throw new PassCryptoError('Could not generate PRF bytes');

    const inputKeyMaterial = new Uint8Array(prfBuffer);

    const key = await deriveKey(inputKeyMaterial, new Uint8Array(), HKDF_INFO, { extractable: exported });

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
            // dummy challenge, but no server interaction here.
            // credential used to decrypt a payload.
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
                        first: FIRST_SALT,
                    },
                },
            },
        },
    })) as PublicKeyCredential;

    const serializedKey = await deriveKeyFromPRFCredential(credential, true);

    return serializedKey;
}

export async function generateCredential(user: PublicKeyCredentialUserEntity): Promise<PublicKeyCredential> {
    const publicKey: ExtendedPublicKeyCredentialOptions = {
        rp: {
            name: window.location.hostname,
            id: window.location.hostname,
        },
        user,
        // dummy challenge, but no server interaction here.
        // credential used to encrypt a payload.
        challenge: new Uint8Array([1]),
        pubKeyCredParams: [
            {
                type: 'public-key',
                alg: -8, // Ed25519
            },
            {
                type: 'public-key',
                alg: -7, // ES256
            },
            {
                type: 'public-key',
                alg: -257, // RS256
            },
        ],
        timeout: 60_000,
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
                // Not used, but some browsers throw if not present.
                eval: {
                    first: FIRST_SALT,
                },
            },
        },
    };

    const credential = await navigator.credentials.create({ publicKey });

    if (!(credential instanceof PublicKeyCredential) || !credential.getClientExtensionResults().prf?.enabled) {
        throw new PassCryptoError('Unable to generate credential');
    }

    return credential;
}
