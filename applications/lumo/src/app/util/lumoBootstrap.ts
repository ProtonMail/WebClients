// Bootstrap stuff that's specific to Lumo and not common with other apps.
import type { PrivateKeyReference } from '@protontech/crypto';
import { CryptoProxy, VERIFICATION_STATUS } from '@protontech/crypto';

import { addressKeysThunk, addressesThunk, userKeysThunk } from '@proton/account';
import type { Address, DecryptedAddressKey, DecryptedKey } from '@proton/shared/lib/interfaces';
import { getPrimaryKey } from '@proton/shared/lib/keys';

import { generateMasterKeyBytes } from '../crypto';
import {
    addMasterKey,
    masterKeyFailed,
    masterKeyIneligible,
    masterKeyRetrying,
} from '../redux/slices/core/credentials';
import { updateEligibilityStatus } from '../redux/slices/meta/eligibilityStatus';
import type { LumoDispatch } from '../redux/store';
import type { LumoThunkArguments } from '../redux/thunk';
import { LumoApi } from '../remote/api';
import { convertMasterKeyToApi } from '../remote/conversion';
import '../remote/nativeAuthBridge';
import '../remote/nativeComposerBridge';
import '../remote/nativeFeatureFlagsBridge';
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
        // Wrapped inside the function rather than at the call sites, so the read-after-write
        // verification inside createAndPushMasterKey shows up as a second span under this label.
        const decryptResult = await CryptoProxy.decryptMessage({
            binaryMessage: Uint8Array.fromBase64(encryptedMasterKeyB64),
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
        return decryptResult.data.toBase64();
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
            const encryptedMasterKeyBase64 = encryptedMasterKeyBytes.message.toBase64();

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

/**
 * Shape of the `masterkeys` read. Derived from the API method rather than restated, so the two
 * cannot drift apart.
 */
export type MasterKeyEnvelope = Awaited<ReturnType<LumoApi['getMasterKey']>>;

async function getOrCreateAndPushMasterKeyWithEligibility(
    uid: string,
    uaKeys: UserAndAddressKeys,
    envelopePromise?: Promise<MasterKeyEnvelope>
): Promise<{ eligibility: number; masterKeyBase64: Base64 | null }> {
    const lumoApi = new LumoApi(uid);

    // Reading the envelope needs only the session UID — no PGP keys, no crypto worker — so the
    // caller can issue it before the keys are ready and hand the promise in. Awaiting it here then
    // usually costs nothing.
    // Boot issues this read before the keys are ready and hands the promise in; retry passes
    // nothing and issues it here. Picked first, awaited second: `await a ?? b` would parse as
    // `(await a) ?? b` and yield an unawaited Promise on the retry path.
    const pendingEnvelope = envelopePromise ?? lumoApi.getMasterKey();
    const { eligibility, key: encryptedMasterKey } = await pendingEnvelope;

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

/**
 * Collect the PGP keys the master key envelope is encrypted to.
 *
 * Boot passes in the promises it already launched, so the addresses round trip and the user-key
 * unlocks overlap instead of running back to back. Retry passes nothing and relies on the model
 * thunks' caches, which are warm by then — so a retry costs one `masterkeys` round trip, not a
 * second pass over the whole key hierarchy.
 */
export const loadUserAndAddressKeys = (
    addressesPromise?: Promise<Address[]>,
    userKeysPromise?: Promise<DecryptedKey<PrivateKeyReference>[]>
) => {
    return async (dispatch: LumoDispatch): Promise<UserAndAddressKeys> => {
        const pendingAddresses = addressesPromise ?? dispatch(addressesThunk());
        const allAddresses = await pendingAddresses;
        if (!allAddresses[0]) {
            throw new Error('Missing primary address');
        }

        const pendingUserKeys = userKeysPromise ?? dispatch(userKeysThunk());
        const allUserKeys = await pendingUserKeys;
        const primaryUserKey = getPrimaryKey(allUserKeys);
        if (!primaryUserKey) {
            throw new Error('Missing primary user key');
        }

        // Address keys need the user keys first: an address key's passphrase is its `Token`, and
        // the Token is a PGP message encrypted to the user keys. This is the one ordering in the
        // whole boot that is genuinely forced by the key hierarchy rather than by how it's written.
        const allAddressKeysArrays = await Promise.all(
            allAddresses.map((address) => dispatch(addressKeysThunk({ addressID: address.ID })))
        );

        return { primaryUserKey, allUserKeys, allAddressKeys: allAddressKeysArrays.flat() };
    };
};

/**
 * Resolve the master key and publish it.
 *
 * Nothing awaits this any more — it runs after the render gate has opened — so it must never
 * throw. Every failure becomes `masterKeyFailed`, which both releases the sagas parked in
 * `waitForMasterKey` and drives the in-app banner. Before this change the throw propagated to
 * `AuthApp` and painted `StandardLoadErrorPage`, which is no longer appropriate once the user may
 * already be mid-conversation.
 */
export const initializeLumoCritical = (
    uaKeys: UserAndAddressKeys,
    uid: string,
    envelopePromise?: Promise<MasterKeyEnvelope>
) => {
    return async (dispatch: LumoDispatch) => {
        try {
            const { eligibility, masterKeyBase64 } = await getOrCreateAndPushMasterKeyWithEligibility(
                uid,
                uaKeys,
                envelopePromise
            );

            dispatch(updateEligibilityStatus(eligibility));

            if (eligibility !== LUMO_ELIGIBILITY.Eligible) {
                dispatch(masterKeyIneligible());
                return null;
            }

            if (!masterKeyBase64) {
                throw new Error('Master key is null despite eligible status');
            }

            // Publishes the key AND starts the data layer, via takeEvery(addMasterKey, initAppSaga).
            dispatch(addMasterKey(masterKeyBase64));

            return { eligibility, masterKeyBase64 };
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            console.error('Lumo master key initialization failed', error);
            dispatch(masterKeyFailed(message));
            return null;
        }
    };
};

/**
 * The whole off-gate key lane: unlock the PGP keys, then resolve the master key. Used by boot with
 * its already-launched promises, and by the retry button with none.
 */
export const loadKeysAndMasterKey = (
    uid: string,
    promises?: {
        addressesPromise?: Promise<Address[]>;
        userKeysPromise?: Promise<DecryptedKey<PrivateKeyReference>[]>;
        envelopePromise?: Promise<MasterKeyEnvelope>;
    }
) => {
    return async (dispatch: LumoDispatch) => {
        try {
            const uaKeys = await dispatch(
                loadUserAndAddressKeys(promises?.addressesPromise, promises?.userKeysPromise)
            );
            return await dispatch(initializeLumoCritical(uaKeys, uid, promises?.envelopePromise));
        } catch (error) {
            // Unlocking the keys failed, so initializeLumoCritical never ran and nobody has
            // reported this yet. Same contract: report through state, never throw.
            const message = error instanceof Error ? error.message : String(error);
            console.error('Lumo key loading failed', error);
            dispatch(masterKeyFailed(message));
            return null;
        }
    };
};

/**
 * Re-run the key load after a failure, from the UI.
 *
 * Takes no promises: boot's are one-shot and have already settled by the time anyone can click
 * retry. The model thunks' caches are warm, so this normally costs one `masterkeys` round trip
 * rather than a second pass over the key hierarchy. Resetting to `loading` first is what releases
 * the UI from the failed state and re-arms `waitForMasterKey` for anything queued afterwards.
 */
export const retryLumoCritical = () => {
    return async (dispatch: LumoDispatch, _getState: () => unknown, extra: LumoThunkArguments) => {
        dispatch(masterKeyRetrying());
        return dispatch(loadKeysAndMasterKey(extra.authentication.getUID()));
    };
};

// TODO: need to handle failures and possibly add retry mechanism
export const initializeLumoBackground = (uid: string) => {
    return async (_dispatch: LumoDispatch) => {
        (window as any).paymentApiInstance.setUid(uid);
    };
};
