// Bootstrap stuff that's specific to Lumo and not common with other apps.
import type { PrivateKeyReference } from '@proton/crypto';
import { CryptoProxy, VERIFICATION_STATUS } from '@proton/crypto';
import { base64StringToUint8Array, uint8ArrayToBase64String } from '@proton/shared/lib/helpers/encoding';
import type { DecryptedAddressKey, DecryptedKey } from '@proton/shared/lib/interfaces';

import { generateMasterKeyBytes } from '../crypto';
import { addMasterKey } from '../redux/slices/core/credentials';
import { updateEligibilityStatus } from '../redux/slices/meta/eligibilityStatus';
import type { LumoDispatch } from '../redux/store';
import { LumoApi } from '../remote/api';
import { convertMasterKeyToApi } from '../remote/conversion';
import '../remote/paymentBridge';
import type { Base64 } from '../types';
import { LUMO_ELIGIBILITY } from '../types';
import { sleep } from './date';

export type UserAndAddressKeys = {
    primaryUserKey: DecryptedKey<PrivateKeyReference>;
    allUserKeys: DecryptedKey<PrivateKeyReference>[];
    allAddressKeys: DecryptedAddressKey<PrivateKeyReference>[];
};

const AES_MASTER_KEY_OPENPGP_SIGNATURE_CONTEXT = 'lumo.aes.key';

async function decryptAndVerifyMasterKey(
    encryptedMasterKeyB64: string,
    { allUserKeys, allAddressKeys }: UserAndAddressKeys
): Promise<Base64 | null> {
    const allKeys = [...allUserKeys, ...allAddressKeys];
    const privateKeys = allKeys.map((key) => key.privateKey);
    const publicKeys = allKeys.map((key) => key.publicKey);

    console.log(
        `Trying to decrypt master key with ${allUserKeys.length} user keys and ${allAddressKeys.length} address keys`
    );

    try {
        const decryptResult = await CryptoProxy.decryptMessage({
            binaryMessage: base64StringToUint8Array(encryptedMasterKeyB64),
            decryptionKeys: privateKeys,
            verificationKeys: publicKeys,
            signatureContext: { value: AES_MASTER_KEY_OPENPGP_SIGNATURE_CONTEXT, required: true },
            format: 'binary',
        });

        if (decryptResult.verificationStatus !== VERIFICATION_STATUS.SIGNED_AND_VALID) {
            console.log('Failed to decrypt remote master key - verification failed');
            return null;
        }

        console.log('Master key was successfully decrypted');
        return uint8ArrayToBase64String(decryptResult.data);
    } catch (error) {
        // This might happen after a user did a password reset; their old keys won't work anymore.
        // By returning null we let caller know this happened and take action.
        console.log('Failed to decrypt remote master key - decryption error:', error);
        return null;
    }
}

async function createAndPushMasterKey(lumoApi: LumoApi, uaKeys: UserAndAddressKeys): Promise<Base64> {
    const BACKOFF_MIN = 1000;
    const BACKOFF_MAX = 4000;
    const MAX_ATTEMPTS = 5;

    let backoff = BACKOFF_MIN;
    let attempts = 0;

    const newMasterKeyBytes = generateMasterKeyBytes();

    while (attempts < MAX_ATTEMPTS) {
        try {
            // encrypt the masterkey
            const { publicKey, privateKey } = uaKeys.primaryUserKey;
            const encryptedMasterKeyBytes = await CryptoProxy.encryptMessage({
                binaryData: newMasterKeyBytes,
                encryptionKeys: publicKey,
                signingKeys: privateKey,
                format: 'binary',
                signatureContext: { critical: true, value: AES_MASTER_KEY_OPENPGP_SIGNATURE_CONTEXT },
            });
            const encryptedMasterKeyBase64 = uint8ArrayToBase64String(encryptedMasterKeyBytes.message);

            // post to API
            const masterKeyToApi = convertMasterKeyToApi(encryptedMasterKeyBase64);
            await lumoApi.postMasterKey(masterKeyToApi);

            // verify it was saved correctly
            const { key: encryptedMasterKeyB64 } = await lumoApi.getMasterKey();
            if (encryptedMasterKeyB64) {
                const decryptedKey = await decryptAndVerifyMasterKey(encryptedMasterKeyB64, uaKeys);
                if (decryptedKey) {
                    return decryptedKey;
                }
                // If we can't decrypt what we just created, this indicates a fundamental error
                // Don't retry as this would just create more corrupted keys
                throw new Error('Failed to decrypt newly created master key');
            }

            throw new Error('Master key was not saved correctly');
        } catch (error) {
            console.error('Error during Lumo master key setup', error);
            attempts += 1;

            if (attempts >= MAX_ATTEMPTS) {
                throw new Error(`Failed to create master key after ${MAX_ATTEMPTS} attempts: ${error}`);
            }
            await sleep(backoff);
            backoff = Math.min(backoff * 2, BACKOFF_MAX);
        }
    }
    throw new Error('Failed to create master key');
}

async function getOrCreateAndPushMasterKeyWithEligibility(
    uid: string,
    uaKeys: UserAndAddressKeys
): Promise<{ eligibility: number; masterKeyBase64: Base64 | null }> {
    const lumoApi = new LumoApi(uid);

    // First check eligibility and existing key
    const { eligibility, key: encryptedMasterKey } = await lumoApi.getMasterKey();

    // If not eligible, return early since non-eligible users will not need masterkey
    if (eligibility !== LUMO_ELIGIBILITY.Eligible) {
        return { eligibility, masterKeyBase64: null };
    }

    // If we have a key already, try to decrypt and verify it
    if (encryptedMasterKey) {
        const decryptedKey = await decryptAndVerifyMasterKey(encryptedMasterKey, uaKeys);
        if (decryptedKey) {
            return { eligibility, masterKeyBase64: decryptedKey };
        }
        console.log('Existing master key could not be decrypted, creating a new one');
    }

    // Need to create a new key (either because there was none, or decryption failed)
    const newMasterKey = await createAndPushMasterKey(lumoApi, uaKeys);
    return { eligibility, masterKeyBase64: newMasterKey };
}

export const initializeLumoCritical = (uaKeys: UserAndAddressKeys, uid: string) => {
    return async (dispatch: LumoDispatch) => {
        const { eligibility, masterKeyBase64 } = await getOrCreateAndPushMasterKeyWithEligibility(uid, uaKeys);

        await Promise.all([
            dispatch(updateEligibilityStatus(eligibility)),
            eligibility === LUMO_ELIGIBILITY.Eligible && masterKeyBase64
                ? dispatch(addMasterKey(masterKeyBase64))
                : Promise.resolve(),
        ]);

        if (eligibility !== LUMO_ELIGIBILITY.Eligible) {
            return null;
        }

        if (!masterKeyBase64) {
            throw new Error('Master key is null despite eligible status');
        }

        return { eligibility, masterKeyBase64 };
    };
};

// TODO: need to handle failures and possibly add retry mechanism
export const initializeLumoBackground = (uid: string) => {
    return async (_dispatch: LumoDispatch) => {
        (window as any).paymentApiInstance.setUid(uid);
    };
};
