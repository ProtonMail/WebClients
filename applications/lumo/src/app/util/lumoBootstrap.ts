// Bootstrap stuff that's specific to Lumo and not common with other apps.
import type { PrivateKeyReference, PublicKeyReference } from '@protontech/crypto';
import { CryptoProxy, VERIFICATION_STATUS } from '@protontech/crypto';

import { addressKeysThunk, addressesThunk, userKeysThunk } from '@proton/account';
import { LUMO_SHORT_APP_NAME } from '@proton/shared/lib/constants';
import type { DecryptedAddressKey, DecryptedKey } from '@proton/shared/lib/interfaces';
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
import type { Base64, MasterKey, MasterKeyFailure, MasterKeysBundle } from '../types';
import { LUMO_ELIGIBILITY } from '../types';
import { sleep } from './date';
import { mergeRefreshedMasterKeysBundle } from './masterKeys';

export type UserKeysOnly = {
    primaryUserKey: DecryptedKey<PrivateKeyReference>;
    allUserKeys: DecryptedKey<PrivateKeyReference>[];
};

const AES_MASTER_KEY_OPENPGP_SIGNATURE_CONTEXT = 'lumo.aes.key';

type PgpKeyPair = {
    privateKey: PrivateKeyReference;
    publicKey: PublicKeyReference;
};

async function decryptAndVerifyMasterKeyWithKeys(
    encryptedMasterKeyB64: string,
    decryptionKeys: PgpKeyPair[],
    verificationKeys: PgpKeyPair[],
    label: string
): Promise<Base64 | null> {
    if (decryptionKeys.length === 0) {
        return null;
    }

    const privateKeys = decryptionKeys.map((key) => key.privateKey);
    const publicKeys = verificationKeys.map((key) => key.publicKey);

    console.log(`Trying to decrypt master key with ${decryptionKeys.length} ${label}`);

    try {
        const decryptResult = await CryptoProxy.decryptMessage({
            binaryMessage: Uint8Array.fromBase64(encryptedMasterKeyB64),
            decryptionKeys: privateKeys,
            verificationKeys: publicKeys,
            signatureContext: { value: AES_MASTER_KEY_OPENPGP_SIGNATURE_CONTEXT, required: true },
            format: 'binary',
        });

        if (decryptResult.verificationStatus !== VERIFICATION_STATUS.SIGNED_AND_VALID) {
            console.log(`Failed to decrypt remote master key with ${label} - verification failed`);
            return null;
        }

        console.log(`Master key was successfully decrypted with ${label}`);
        return decryptResult.data.toBase64();
    } catch (error) {
        console.log(`Failed to decrypt remote master key with ${label} - decryption error:`, error);
        return null;
    }
}

type DecryptedMasterKeyEnvelope = {
    key: Base64;
    usedUserKeys: boolean;
};

export async function decryptMasterKeyEnvelope(
    encryptedMasterKeyB64: string,
    userKeys: DecryptedKey<PrivateKeyReference>[],
    addressKeys?: DecryptedAddressKey<PrivateKeyReference>[]
): Promise<DecryptedMasterKeyEnvelope | null> {
    const withUserKeys = await decryptAndVerifyMasterKeyWithKeys(
        encryptedMasterKeyB64,
        userKeys,
        userKeys,
        'user keys'
    );
    if (withUserKeys) {
        return { key: withUserKeys, usedUserKeys: true };
    }

    if (addressKeys && addressKeys.length > 0) {
        // Before June 2025, envelopes were both encrypted and signed with the primary address key.
        // During the transition to user keys, envelopes could instead be address-encrypted and
        // user-signed. Both signer types are therefore required for legacy recovery.
        const legacyVerificationKeys = [...userKeys, ...addressKeys];
        const withAddressKeys = await decryptAndVerifyMasterKeyWithKeys(
            encryptedMasterKeyB64,
            addressKeys,
            legacyVerificationKeys,
            'address keys'
        );
        if (withAddressKeys) {
            return { key: withAddressKeys, usedUserKeys: false };
        }
    }

    return null;
}

async function encryptMasterKeyEnvelope(
    aesMasterKeyBase64: Base64,
    primaryUserKey: DecryptedKey<PrivateKeyReference>
): Promise<Base64> {
    const aesMasterKeyBytes = Uint8Array.fromBase64(aesMasterKeyBase64);
    const encryptedMasterKeyBytes = await CryptoProxy.encryptMessage({
        binaryData: aesMasterKeyBytes,
        encryptionKeys: primaryUserKey.publicKey,
        signingKeys: primaryUserKey.privateKey,
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
            const { bundle } = await decryptAllMasterKeys(masterKeyEnvelopes, userKeys.allUserKeys, (keys) =>
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

type DecryptAllMasterKeysResult = {
    bundle: MasterKeysBundle | null;
    /** Raw decrypted envelopes, retained even when no primary envelope can yet be selected. */
    masterKeys: Record<string, Base64>;
    /** AES master keys recovered via address keys that have no user-key-decryptable envelope yet. */
    addressOnlyMasterKeys: Base64[];
    decryptedCount: number;
};

function buildMasterKeysBundle(
    envelopes: MasterKey[],
    masterKeys: Record<string, Base64>,
    findBestKey: (keys: MasterKey[]) => MasterKey | undefined
): MasterKeysBundle | null {
    const decryptedCount = Object.keys(masterKeys).length;
    if (decryptedCount === 0) {
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

async function decryptAllMasterKeys(
    envelopes: MasterKey[],
    userKeys: DecryptedKey<PrivateKeyReference>[],
    findBestKey: (keys: MasterKey[]) => MasterKey | undefined,
    options?: {
        addressKeys?: DecryptedAddressKey<PrivateKeyReference>[];
        existingMasterKeys?: Record<string, Base64>;
    }
): Promise<DecryptAllMasterKeysResult> {
    const masterKeys = { ...(options?.existingMasterKeys ?? {}) };
    const userDecryptableKeyValues = new Set<Base64>(
        options?.existingMasterKeys ? Object.values(options.existingMasterKeys) : []
    );
    const envelopesToTry = envelopes.filter((envelope) => !masterKeys[envelope.id]);

    await Promise.all(
        envelopesToTry.map(async (envelope) => {
            const decrypted = await decryptMasterKeyEnvelope(envelope.masterKey, userKeys, options?.addressKeys);
            if (!decrypted) {
                return;
            }

            masterKeys[envelope.id] = decrypted.key;
            if (decrypted.usedUserKeys) {
                userDecryptableKeyValues.add(decrypted.key);
            }
        })
    );

    const addressOnlyMasterKeys = [
        ...new Set(Object.values(masterKeys).filter((keyBase64) => !userDecryptableKeyValues.has(keyBase64))),
    ];

    return {
        bundle: buildMasterKeysBundle(envelopes, masterKeys, findBestKey),
        masterKeys,
        addressOnlyMasterKeys,
        decryptedCount: Object.keys(masterKeys).length,
    };
}

async function migratePrimaryMasterKeyToUserKey(
    lumoApi: LumoApi,
    userKeys: UserKeysOnly,
    primaryMasterKey: Base64
): Promise<void> {
    console.log('Re-wrapping recovered primary master key envelope with user key');
    const encryptedMasterKeyBase64 = await encryptMasterKeyEnvelope(primaryMasterKey, userKeys.primaryUserKey);
    await lumoApi.postMasterKey(convertMasterKeyToApi(encryptedMasterKeyBase64));
}

type ResolveMasterKeysResult =
    | { outcome: 'success'; bundle: MasterKeysBundle }
    | { outcome: 'none_decrypted' }
    | { outcome: 'no_primary'; decryptedCount: number; totalCount: number };

/**
 * Resolve master key envelopes: user keys first, address keys only as a last resort for envelopes
 * that user keys could not decrypt.
 */
async function resolveMasterKeysBundle(
    lumoApi: LumoApi,
    userKeys: UserKeysOnly,
    envelopes: MasterKey[],
    loadAddressKeys: () => Promise<DecryptedAddressKey<PrivateKeyReference>[]>
): Promise<ResolveMasterKeysResult> {
    const findBestKey = (keys: MasterKey[]) => lumoApi.findBestKey(keys);

    let { bundle, masterKeys, addressOnlyMasterKeys, decryptedCount } = await decryptAllMasterKeys(
        envelopes,
        userKeys.allUserKeys,
        findBestKey
    );

    const undecryptedCount = envelopes.length - decryptedCount;
    if (undecryptedCount > 0) {
        console.log(
            `${undecryptedCount}/${envelopes.length} master key envelope(s) could not be decrypted with user keys; trying address keys as fallback`
        );
        const addressKeys = await loadAddressKeys();
        if (addressKeys.length > 0) {
            ({ bundle, masterKeys, addressOnlyMasterKeys, decryptedCount } = await decryptAllMasterKeys(
                envelopes,
                userKeys.allUserKeys,
                findBestKey,
                {
                    addressKeys,
                    existingMasterKeys: masterKeys,
                }
            ));
        }
    }

    if (decryptedCount === 0) {
        console.log(
            `None of the ${envelopes.length} existing master key envelope(s) could be decrypted with available keys`
        );
        return { outcome: 'none_decrypted' };
    }

    if (!bundle) {
        console.log(
            `Decrypted ${decryptedCount}/${envelopes.length} master key envelope(s) but could not select a primary envelope`
        );
        return { outcome: 'no_primary', decryptedCount, totalCount: envelopes.length };
    }

    if (addressOnlyMasterKeys.includes(bundle.primaryMasterKey)) {
        console.log('Migrating the primary master key to a user-key-wrapped envelope');
        const bundleBeforeMigration = bundle;
        try {
            await migratePrimaryMasterKeyToUserKey(lumoApi, userKeys, bundle.primaryMasterKey);
            const { keys: refreshedEnvelopes } = await lumoApi.getMasterKeys();
            const { bundle: refreshedBundle } = await decryptAllMasterKeys(
                refreshedEnvelopes,
                userKeys.allUserKeys,
                findBestKey
            );
            if (refreshedBundle) {
                bundle = mergeRefreshedMasterKeysBundle(bundleBeforeMigration, refreshedBundle);
            }
        } catch (error) {
            console.error(
                'Failed to migrate master key envelope(s) to user key; address keys may still be required',
                error
            );
            bundle = bundleBeforeMigration;
        }
    }

    const stillUndecrypted = envelopes.length - Object.keys(bundle.masterKeys).length;
    if (stillUndecrypted > 0) {
        console.log(
            `Decrypted ${Object.keys(bundle.masterKeys).length}/${envelopes.length} master key envelope(s); ${stillUndecrypted} legacy envelope(s) remain undecryptable`
        );
    }

    return { outcome: 'success', bundle };
}

function masterKeyResolutionFailure(
    result: Exclude<ResolveMasterKeysResult, { outcome: 'success' }>
): MasterKeyFailure {
    if (result.outcome === 'none_decrypted') {
        return {
            message: `Your existing ${LUMO_SHORT_APP_NAME} encryption key could not be recovered with the available account keys.`,
            reason: 'undecryptable_envelopes',
        };
    }

    return {
        message: `Recovered ${result.decryptedCount}/${result.totalCount} encryption key envelopes but could not select a primary key`,
        reason: 'no_primary_envelope',
    };
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

            if (masterKeyEnvelopes.length > 0) {
                const resolution = await resolveMasterKeysBundle(lumoApi, userKeys, masterKeyEnvelopes, () =>
                    dispatch(loadAddressKeys())
                );

                if (resolution.outcome !== 'success') {
                    dispatch(masterKeyFailed(masterKeyResolutionFailure(resolution)));
                    return null;
                }

                dispatch(addMasterKey(resolution.bundle));
                return { eligibility, masterKeysBundle: resolution.bundle };
            }

            const masterKeysBundle = await createAndPushMasterKeysBundle(lumoApi, userKeys);
            dispatch(addMasterKey(masterKeysBundle));

            return { eligibility, masterKeysBundle };
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            console.error('Lumo master key initialization failed', error);
            dispatch(masterKeyFailed({ message, reason: 'unknown' }));
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

/** Loaded lazily — only when user keys alone cannot decrypt a master key envelope. */
export const loadAddressKeys = () => {
    return async (dispatch: LumoDispatch): Promise<DecryptedAddressKey<PrivateKeyReference>[]> => {
        const allAddresses = await dispatch(addressesThunk());
        if (!allAddresses[0]) {
            return [];
        }

        const allAddressKeysArrays = await Promise.all(
            allAddresses.map((address) => dispatch(addressKeysThunk({ addressID: address.ID })))
        );
        return allAddressKeysArrays.flat();
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
            dispatch(masterKeyFailed({ message, reason: 'unknown' }));
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
