import { AuthenticatorEncryptionTag } from 'proton-authenticator/lib/crypto';
import logger from 'proton-authenticator/lib/logger';

import { ARGON2_PARAMS, CryptoProxy } from '@proton/crypto/lib';
import { decryptData, encryptData, generateKey, importKey } from '@proton/crypto/lib/subtle/aesGcm';
import { stringToUint8Array, uint8ArrayToString } from '@proton/shared/lib/helpers/encoding';

type Argon2Params = (typeof ARGON2_PARAMS)[keyof typeof ARGON2_PARAMS];
type Argon2Options = Parameters<typeof CryptoProxy.computeArgon2>[0];

export type OfflineConfig = {
    salt: string;
    params: Argon2Params;
    /** version=1|undefined : legacy `offlineVerifier`
     *  version=2 : tagged with AuthenticatorEncryptionTag.Offline */
    version?: 1 | 2;
};

export type OfflineComponents = {
    /** Argon2 derivation of the user password */
    offlineKD: Uint8Array<ArrayBuffer>;
    /** The salt & argon2 parameters used to generated the offline
     * key derivation. Defaults to `ARGON2_PARAMS.RECOMMENDED` */
    offlineConfig: OfflineConfig;
    /** A random 32 bytes string encrypted with the offlineKD.
     * Allows verifying a local password via argon2 derivation. */
    offlineVerifier: string;
};

const OFFLINE_SALT_LENGTH = 32;

const generateOfflineKD = async ({ password, salt, params }: Argon2Options): Promise<Uint8Array<ArrayBuffer>> =>
    CryptoProxy.computeArgon2({ params, password, salt });

/** FIXME: offlineVerifier should be encrypted with a proper crypto context */
const createOfflineVerifier = async (offlineKD: Uint8Array<ArrayBuffer>): Promise<string> => {
    const offlineKey = await importKey(offlineKD);
    const verifier = generateKey();
    const tag = stringToUint8Array(AuthenticatorEncryptionTag.OfflineVerifier);
    const offlineVerifier = await encryptData(offlineKey, verifier, tag);

    return uint8ArrayToString(offlineVerifier);
};

export const getOfflineComponents = async (password: string): Promise<OfflineComponents> => {
    const salt = crypto.getRandomValues(new Uint8Array(OFFLINE_SALT_LENGTH));
    const params = ARGON2_PARAMS.RECOMMENDED;

    const offlineKD = await generateOfflineKD({ password, salt, params }).catch((error) => {
        logger.warn(`[Argon2] Key derivation error (${error})`);
        throw new Error('Argon2 failure');
    });

    return {
        offlineKD,
        offlineConfig: { salt: uint8ArrayToString(salt), params, version: 2 },
        offlineVerifier: await createOfflineVerifier(offlineKD),
    };
};

/** Checks that the given password can be verified against the `offlineVerifier`.
 * If we can successfully decrypt the `offlineVerifier`, then password is correct.
 * Returns the argon2 hash on successfull decryption of the verifier. */
export const verifyOfflinePassword = async (
    password: string,
    { offlineVerifier, offlineConfig: { salt, params, version = 1 } }: Omit<OfflineComponents, 'offlineKD'>
): Promise<OfflineComponents['offlineKD']> => {
    const offlineKD = await generateOfflineKD({ password, salt: stringToUint8Array(salt), params });
    const offlineKey = await importKey(offlineKD);
    const tag = version > 1 ? stringToUint8Array(AuthenticatorEncryptionTag.OfflineVerifier) : undefined;

    await decryptData(offlineKey, stringToUint8Array(offlineVerifier), tag);
    return offlineKD;
};
