import { CryptoProxy, PublicKeyReference, VERIFICATION_STATUS } from '@proton/crypto';
import { KEY_FLAG } from '@proton/shared/lib/constants';
import { hasBit } from '@proton/shared/lib/helpers/bitset';
import {
    Api,
    ArmoredKeyWithFlags,
    FetchedSignedKeyList,
    IGNORE_KT,
    SignedKeyListItem,
} from '@proton/shared/lib/interfaces';
import { getParsedSignedKeyList } from '@proton/shared/lib/keys';

import { NO_KT_DOMAINS } from '../constants/domains';
import { fetchEpoch } from '../helpers/fetchHelpers';
import { getEmailDomain, isTimestampTooOld, ktSentryReport } from '../helpers/utils';
import { Epoch, KT_STATUS, KeyWithFlags } from '../interfaces';
import { verifySKLInsideEpoch } from './verifyEpochs';
import { verifySKLAbsenceOrObsolescence } from './verifyProofs';

/**
 * Check that two SKLs are identical
 */
export const checkSKLEquality = (skl1: FetchedSignedKeyList, skl2: FetchedSignedKeyList) =>
    skl1.Data === skl2.Data && skl1.Signature === skl2.Signature;

/**
 * Import a list of armored keys
 */
export const importKeys = async (keyList: ArmoredKeyWithFlags[]): Promise<KeyWithFlags[]> =>
    Promise.all(
        keyList.map(async ({ PublicKey: armoredKey, Flags }) => ({
            PublicKey: await CryptoProxy.importPublicKey({ armoredKey }),
            Flags,
        }))
    );

/**
 * Parse a key list into a list of key info
 */
export const parseKeyList = async (keyList: KeyWithFlags[]): Promise<SignedKeyListItem[]> =>
    Promise.all(
        keyList.map(async ({ PublicKey, Flags }, index) => ({
            Fingerprint: PublicKey.getFingerprint(),
            SHA256Fingerprints: await CryptoProxy.getSHA256Fingerprints({ key: PublicKey }),
            Primary: index === 0 ? 1 : 0,
            Flags: Flags,
        }))
    );

/**
 * Check whether the metadata of a key matches what is stored in the Signed Key List
 */
const compareKeyInfo = (keyInfo: SignedKeyListItem, sklKeyInfo: SignedKeyListItem) => {
    // Check fingerprints
    if (keyInfo.Fingerprint !== sklKeyInfo.Fingerprint) {
        throw new Error('Fingerprints');
    }

    // Check SHA256Fingerprints
    if (keyInfo.SHA256Fingerprints.length !== sklKeyInfo.SHA256Fingerprints.length) {
        throw new Error('SHA256Fingerprints length');
    }
    keyInfo.SHA256Fingerprints.forEach((sha256Fingerprint, i) => {
        if (sha256Fingerprint !== sklKeyInfo.SHA256Fingerprints[i]) {
            throw new Error('SHA256Fingerprints');
        }
    });

    // Check Flags
    if (keyInfo.Flags !== sklKeyInfo.Flags) {
        throw new Error('Flags');
    }

    // Check primariness
    if (keyInfo.Primary !== sklKeyInfo.Primary) {
        throw new Error('Primariness');
    }
};

/**
 * Check that a list of keys is correctly represented by a Signed Key List
 */
export const verifyKeyList = async (keyListInfo: SignedKeyListItem[], signedKeyListInfo: SignedKeyListItem[]) => {
    // Check arrays validity
    if (keyListInfo.length === 0) {
        throw new Error('No keys detected');
    }
    if (keyListInfo.length !== signedKeyListInfo.length) {
        throw new Error('Key list and signed key list have different lengths');
    }

    // Sorting both lists just to make sure key infos appear in the same order
    keyListInfo.sort((key1, key2) => {
        return key1.Fingerprint.localeCompare(key2.Fingerprint);
    });
    signedKeyListInfo.sort((key1, key2) => {
        return key1.Fingerprint.localeCompare(key2.Fingerprint);
    });

    // Check keys
    keyListInfo.forEach((key, i) => compareKeyInfo(key, signedKeyListInfo[i]));
};

/**
 * Check that the given keys mirror what's inside the given SKL Data
 */
export const checkKeysInSKL = async (importedKeysWithFlags: KeyWithFlags[], sklData: string) => {
    const parsedSKL = getParsedSignedKeyList(sklData);
    if (!parsedSKL) {
        throw new Error('SignedKeyList data parsing failed');
    }

    const keyListInfo = await parseKeyList(importedKeysWithFlags);
    return verifyKeyList(keyListInfo, parsedSKL);
};

export const verifySKLSignature = async (
    verificationKeys: PublicKeyReference[],
    signedKeyListData: string,
    signedKeyListSignature: string,
    context: string
): Promise<Date | null> => {
    const { verified, signatureTimestamp, errors } = await CryptoProxy.verifyMessage({
        armoredSignature: signedKeyListSignature,
        verificationKeys,
        textData: signedKeyListData,
    });
    if (verified !== VERIFICATION_STATUS.SIGNED_AND_VALID) {
        ktSentryReport('SKL signature verification failed', {
            context: context,
            errors: JSON.stringify(errors),
        });
        return null;
    }
    return signatureTimestamp;
};

/**
 * Verify that public keys associated to an email address are correctly stored in KT
 */
export const verifyPublicKeys = async (
    armoredKeysWithFlags: ArmoredKeyWithFlags[],
    email: string,
    signedKeyList: FetchedSignedKeyList | null,
    api: Api,
    IgnoreKT?: IGNORE_KT
): Promise<KT_STATUS> => {
    // Temporary kill switch for cases that cannot be truly verified
    // using the current v4 GET /keys route
    if (IgnoreKT !== IGNORE_KT.NORMAL) {
        return KT_STATUS.KT_PASSED;
    }

    if (!signedKeyList) {
        try {
            if (!NO_KT_DOMAINS.includes(getEmailDomain(email))) {
                await verifySKLAbsenceOrObsolescence(api, email);
            }
            return KT_STATUS.KT_PASSED;
        } catch (error: any) {
            return KT_STATUS.KT_FAILED;
        }
    }

    const { Data, Signature, MaxEpochID } = signedKeyList;
    // The following checks can only be executed if the SKL is non-obsolescent
    if (Data && Signature) {
        const importedKeysWithFlags = await importKeys(armoredKeysWithFlags);

        const verificationKeys = importedKeysWithFlags
            .filter(({ Flags }) => hasBit(Flags, KEY_FLAG.FLAG_NOT_COMPROMISED))
            .map(({ PublicKey }) => PublicKey);

        // Verify signature
        const verified = await verifySKLSignature(verificationKeys, Data, Signature, 'verifyPublicKeys');

        if (!verified) {
            return KT_STATUS.KT_FAILED;
        }

        // Verify key list and signed key list
        try {
            await checkKeysInSKL(importedKeysWithFlags, Data);
        } catch (error: any) {
            ktSentryReport('Keys and SKL do not match', {
                context: 'verifyPublicKeys',
                error,
            });
            return KT_STATUS.KT_FAILED;
        }
    }

    // If signedKeyList is (allegedly) too young, users is warned and verification cannot continue.
    // If MinEpochID is null, so is MaxEpochID. The latter is checked only to rule out its nullness
    // for typing in the rest of the function
    if (MaxEpochID === null) {
        return KT_STATUS.KT_MINEPOCHID_NULL;
    }

    // Verify latest epoch
    let maxEpoch: Epoch;
    try {
        maxEpoch = await fetchEpoch(MaxEpochID, api);
    } catch (error: any) {
        ktSentryReport(error.message, {
            context: 'verifyPublicKeys',
        });
        return KT_STATUS.KT_FAILED;
    }

    let certificateTimestamp: number;
    try {
        ({ certificateTimestamp } = await verifySKLInsideEpoch(maxEpoch, email, signedKeyList, api));
    } catch (error: any) {
        return KT_STATUS.KT_FAILED;
    }

    if (isTimestampTooOld(certificateTimestamp)) {
        ktSentryReport('Returned date is older than MAX_EPOCH_INTERVAL', {
            context: 'verifyPublicKeys',
            certificateTimestamp,
        });
        return KT_STATUS.KT_FAILED;
    }

    return KT_STATUS.KT_PASSED;
};
