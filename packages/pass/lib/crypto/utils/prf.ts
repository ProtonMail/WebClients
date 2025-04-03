import { deriveKey } from '@proton/crypto/lib/subtle/aesGcm';
import { arrayToBinaryString } from '@proton/crypto/lib/utils';
import type { AuthStore } from '@proton/pass/lib/auth/store';
import type { MaybeNull } from '@proton/pass/types/utils';
import { isChromiumBased, isMinimumSafariVersion, isWindows } from '@proton/shared/lib/helpers/browser';
import { stringToUint8Array } from '@proton/shared/lib/helpers/encoding';

import { PassCryptoError } from './errors';

/** Dummy challenge as no server interaction here.
 * Credential used to encrypt a payload */
const CHALLENGE = new Uint8Array([1]);
const FIRST_SALT = stringToUint8Array('proton.pass.webauthn.prf.firstSalt').buffer;
const HKDF_INFO = stringToUint8Array('proton.pass.webauthn.prf');

/** Until PRF is more widely adopted, we additionaly restrict this
 *  to exclude Windows, Safari < 18, and non-Chromium-based browsers */
export const isPRFSupported = async (): Promise<boolean> => {
    try {
        if (isWindows() || !(isChromiumBased() || isMinimumSafariVersion(18))) return false;
        return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    } catch {
        return false;
    }
};

export const assertPublicKeyCredential = (credential: MaybeNull<Credential>): credential is PublicKeyCredential =>
    credential instanceof PublicKeyCredential;

export const assertPRFCredential = (credential: MaybeNull<Credential>): credential is PublicKeyCredential =>
    assertPublicKeyCredential(credential) && (credential.getClientExtensionResults().prf?.enabled ?? false);

export const extractPRFBuffer = (credential: MaybeNull<Credential>): ArrayBuffer => {
    if (!assertPublicKeyCredential(credential)) throw new PassCryptoError('Invalid credential');

    const extensions = credential.getClientExtensionResults();
    const prfBuffer = extensions.prf?.results?.first;

    if (!prfBuffer) throw new PassCryptoError('Could not generate PRF bytes');

    return prfBuffer as ArrayBuffer;
};

export async function deriveKeyFromPRFCredential(credential: MaybeNull<Credential>, extractable: true): Promise<string>;
export async function deriveKeyFromPRFCredential(credential: MaybeNull<Credential>): Promise<CryptoKey>;
export async function deriveKeyFromPRFCredential(credential: MaybeNull<Credential>, extractable: boolean = false) {
    const prfBuffer = extractPRFBuffer(credential);
    const inputKeyMaterial = new Uint8Array(prfBuffer);

    /** The PRF key is derived for this specific use-case so it can in principle be used directly
     * with GCM, but we prefer to add the HKDF step to bind it to the HKDF_INFO context :
     * see: https://datatracker.ietf.org/doc/html/rfc5869#section-3.1 */
    const key = await deriveKey(inputKeyMaterial, new Uint8Array(), HKDF_INFO, { extractable });

    if (extractable) {
        const exported = await crypto.subtle.exportKey('raw', key);
        return arrayToBinaryString(new Uint8Array(exported));
    }

    return key;
}

export async function getSerializedCredential(credentialId: Uint8Array) {
    const credential = await navigator.credentials.get({
        mediation: 'required',
        publicKey: {
            challenge: CHALLENGE,
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
    });

    return deriveKeyFromPRFCredential(credential, true);
}

export async function generateCredential(authStore: AuthStore): Promise<PublicKeyCredential> {
    const UID = authStore.getUID();
    if (!UID) throw new Error('Invalid user');

    const user: PublicKeyCredentialUserEntity = {
        displayName: authStore.getUserDisplayName()!,
        name: authStore.getUserEmail()!,
        /** Using UID for the credential ID as it's unique per session. As the webauthn
         * credentials are tied to a specific user session, avoid using userID or localID
         * which could cause clashes when re-registering a credential for the same ID */
        id: stringToUint8Array(UID),
    };

    const publicKey: PublicKeyCredentialCreationOptions = {
        rp: {
            name: window.location.hostname,
            id: window.location.hostname,
        },
        user,
        challenge: CHALLENGE,
        pubKeyCredParams: [
            { type: 'public-key', alg: -8 }, // ED25519
            { type: 'public-key', alg: -7 }, // ES256
            { type: 'public-key', alg: -257 }, // RS256
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
                /** Failing to evaluate the PRF during creation
                 * will cause the sequence to fail. As of now, this
                 * isn't possible using chrome's passkey manager, or
                 * security keys as it cannot be expressed with the
                 * CTAP2 hmac-secret extension */
                eval: { first: FIRST_SALT },
            },
        },
    };

    const credential = await navigator.credentials.create({ publicKey }).catch(() => null);
    if (!assertPRFCredential(credential)) throw new PassCryptoError('Unable to generate credential');

    return credential;
}
