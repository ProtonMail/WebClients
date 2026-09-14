// Bootstrap stuff that's specific to Lumo and not common with other apps.
import type { PrivateKeyReference } from '@protontech/crypto';
import { CryptoProxy, VERIFICATION_STATUS } from '@protontech/crypto';

import { userKeysThunk } from '@proton/account';
import type { DecryptedKey } from '@proton/shared/lib/interfaces';
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
import type { Base64, MasterKey, MasterKeysBundle } from '../types';
import { LUMO_ELIGIBILITY } from '../types';
import { sleep } from './date';

export type UserKeysOnly = {
    primaryUserKey: DecryptedKey<PrivateKeyReference>;
    allUserKeys: DecryptedKey<PrivateKeyReference>[];
};

const AES_MASTER_KEY_OPENPGP_SIGNATURE_CONTEXT = 'lumo.aes.key';

async function decryptAndVerifyMasterKey(
    encryptedMasterKeyB64: string,
    userKeys: DecryptedKey<PrivateKeyReference>[]
): Promise<Base64 | null> {
    const privateKeys = userKeys.map((key) => key.privateKey);
    const publicKeys = userKeys.map((key) => key.publicKey);

    console.log(`Trying to decrypt master key with ${userKeys.length} user keys`);

    try {
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

async function encryptMasterKeyEnvelope(
    aesMasterKeyBase64: Base64,
    primaryUserKey: DecryptedKey<PrivateKeyReference>
): Promise<Base64> {
    const aesMasterKeyBytes = Uint8Array.fromBase64(aesMasterKeyBase64);
    const { publicKey, privateKey } = primaryUserKey;
    const encryptedMasterKeyBytes = await CryptoProxy.encryptMessage({
        binaryData: aesMasterKeyBytes,
        encryptionKeys: publicKey,
        signingKeys: privateKey,
        format: 'binary',
        signatureContext: { critical: true, value: AES_MASTER_KEY_OPENPGP_SIGNATURE_CONTEXT },
    });
    return encryptedMasterKeyBytes.message.toBase64();
}

async function createAndPushMasterKeysBundle(lumoApi: LumoApi, userKeys: UserKeysOnly): Promise<MasterKeysBundle> {
    const BACKOFF_MIN = 1000;
    const BACKOFF_MAX = 4000;
    const MAX_ATTEMPTS = 5;

    let backoff = BACKOFF_MIN;
    let attempts = 0;

    const newMasterKeyBytes = generateMasterKeyBytes();

    while (attempts < MAX_ATTEMPTS) {
        try {
            const encryptedMasterKeyBase64 = await encryptMasterKeyEnvelope(
                newMasterKeyBytes.toBase64(),
                userKeys.primaryUserKey
            );

            await lumoApi.postMasterKey(convertMasterKeyToApi(encryptedMasterKeyBase64));

            const { keys: masterKeyEnvelopes } = await lumoApi.getMasterKeys();
            const bundle = await decryptAllMasterKeys(masterKeyEnvelopes, userKeys.allUserKeys, (keys) =>
                lumoApi.findBestKey(keys)
            );
            if (bundle) {
                return bundle;
            }

            throw new Error('Failed to decrypt newly created master key');
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
export type MasterKeyEnvelope = Awaited<ReturnType<LumoApi['getMasterKeys']>>;

async function decryptAllMasterKeys(
    envelopes: MasterKey[],
    userKeys: DecryptedKey<PrivateKeyReference>[],
    findBestKey: (keys: MasterKey[]) => MasterKey | undefined
): Promise<MasterKeysBundle | null> {
    const decryptedKeys = await Promise.all(
        envelopes.map(async (envelope) => ({
            id: envelope.id,
            key: await decryptAndVerifyMasterKey(envelope.masterKey, userKeys),
        }))
    );
    const masterKeys = decryptedKeys.reduce<Record<string, Base64>>((result, { id, key }) => {
        if (key) {
            result[id] = key;
        }
        return result;
    }, {});

    if (Object.keys(masterKeys).length === 0) {
        return null;
    }

    const decryptedEnvelopes = envelopes.filter((envelope) => masterKeys[envelope.id]);
    const primaryEnvelope = findBestKey(decryptedEnvelopes);
    if (!primaryEnvelope) {
        return null;
    }

    return {
        primaryMasterKeyId: primaryEnvelope.id,
        primaryMasterKey: masterKeys[primaryEnvelope.id],
        masterKeys,
    };
}

/**
 * Master key envelope resolution with user keys only. Older address-key-wrapped envelopes are
 * ignored — they only mattered for pre-release internal chats.
 */
async function resolveMasterKeysBundle(
    lumoApi: LumoApi,
    userKeys: UserKeysOnly,
    envelopes: MasterKey[]
): Promise<MasterKeysBundle | null> {
    const findBestKey = (keys: MasterKey[]) => lumoApi.findBestKey(keys);

    const bundle = await decryptAllMasterKeys(envelopes, userKeys.allUserKeys, findBestKey);

    if (!bundle) {
        console.log(
            `None of the ${envelopes.length} existing master key envelope(s) could be decrypted with user keys; creating a new master key`
        );
        return null;
    }

    const undecryptedCount = envelopes.length - Object.keys(bundle.masterKeys).length;
    if (undecryptedCount > 0) {
        console.log(
            `Decrypted ${Object.keys(bundle.masterKeys).length}/${envelopes.length} master key envelope(s) with user keys; ignoring ${undecryptedCount} undecryptable legacy envelope(s)`
        );
    }

    return bundle;
}

export const initializeLumoCritical = (
    userKeys: UserKeysOnly,
    uid: string,
    envelopePromise?: Promise<MasterKeyEnvelope>
) => {
    return async (dispatch: LumoDispatch) => {
        try {
            const lumoApi = new LumoApi(uid);

            const pendingEnvelope = envelopePromise ?? lumoApi.getMasterKeys();
            const { eligibility, keys: masterKeyEnvelopes } = await pendingEnvelope;

            dispatch(updateEligibilityStatus(eligibility));

            if (eligibility !== LUMO_ELIGIBILITY.Eligible) {
                dispatch(masterKeyIneligible());
                return null;
            }

            const existingBundle =
                masterKeyEnvelopes.length > 0
                    ? await resolveMasterKeysBundle(lumoApi, userKeys, masterKeyEnvelopes)
                    : null;
            const masterKeysBundle = existingBundle ?? (await createAndPushMasterKeysBundle(lumoApi, userKeys));

            dispatch(addMasterKey(masterKeysBundle));

            return { eligibility, masterKeysBundle };
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            console.error('Lumo master key initialization failed', error);
            dispatch(masterKeyFailed(message));
            return null;
        }
    };
};

export const loadUserKeys = (userKeysPromise?: Promise<DecryptedKey<PrivateKeyReference>[]>) => {
    return async (dispatch: LumoDispatch): Promise<UserKeysOnly> => {
        const pendingUserKeys = userKeysPromise ?? dispatch(userKeysThunk());
        const allUserKeys = await pendingUserKeys;
        const primaryUserKey = getPrimaryKey(allUserKeys);
        if (!primaryUserKey) {
            throw new Error('Missing primary user key');
        }

        return { primaryUserKey, allUserKeys };
    };
};

export const loadKeysAndMasterKey = (
    uid: string,
    promises?: {
        userKeysPromise?: Promise<DecryptedKey<PrivateKeyReference>[]>;
        envelopePromise?: Promise<MasterKeyEnvelope>;
    }
) => {
    return async (dispatch: LumoDispatch) => {
        try {
            const userKeys = await dispatch(loadUserKeys(promises?.userKeysPromise));
            return await dispatch(initializeLumoCritical(userKeys, uid, promises?.envelopePromise));
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            console.error('Lumo key loading failed', error);
            dispatch(masterKeyFailed(message));
            return null;
        }
    };
};

export const retryLumoCritical = () => {
    return async (dispatch: LumoDispatch, _getState: () => unknown, extra: LumoThunkArguments) => {
        dispatch(masterKeyRetrying());
        return dispatch(loadKeysAndMasterKey(extra.authentication.getUID()));
    };
};

export const initializeLumoBackground = (uid: string) => {
    return async (_dispatch: LumoDispatch) => {
        (window as any).paymentApiInstance.setUid(uid);
    };
};
