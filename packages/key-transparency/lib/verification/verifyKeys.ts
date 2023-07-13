import { CryptoProxy, PublicKeyReference, VERIFICATION_STATUS } from '@proton/crypto';
import {
    Api,
    ArmoredKeyWithFlags,
    FetchedSignedKeyList,
    GetLatestEpoch,
    KT_VERIFICATION_STATUS,
    KeyTransparencyVerificationResult,
    SaveSKLToLS,
    SignedKeyListItem,
} from '@proton/shared/lib/interfaces';
import { getParsedSignedKeyList } from '@proton/shared/lib/keys';

import { KT_SKL_VERIFICATION_CONTEXT } from '../constants';
import { NO_KT_DOMAINS } from '../constants/domains';
import { fetchProof } from '../helpers/apiHelpers';
import { KeyTransparencyError, getEmailDomain, throwKTError } from '../helpers/utils';
import { KeyWithFlags } from '../interfaces';
import {
    verifyProofOfAbsenceForAllRevision,
    verifyProofOfAbsenceForRevision,
    verifyProofOfExistence,
    verifyProofOfObsolescence,
} from './verifyProofs';

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
        keyList.map(async ({ PublicKey: armoredKey, Flags, Primary }) => ({
            PublicKey: await CryptoProxy.importPublicKey({ armoredKey }),
            Flags,
            Primary,
        }))
    );

/**
 * Parse a key list into a list of key info
 */
export const parseKeyList = async (keyList: KeyWithFlags[]): Promise<SignedKeyListItem[]> =>
    Promise.all(
        keyList.map(async ({ PublicKey, Flags, Primary }, index) => ({
            Fingerprint: PublicKey.getFingerprint(),
            SHA256Fingerprints: await CryptoProxy.getSHA256Fingerprints({ key: PublicKey }),
            Primary: Primary ?? index === 0 ? 1 : 0,
            Flags: Flags,
        }))
    );

/**
 * Check whether the metadata of a key matches what is stored in the Signed Key List
 */
const compareKeyInfo = (email: string, keyInfo: SignedKeyListItem, sklKeyInfo: SignedKeyListItem) => {
    // Check fingerprints
    if (keyInfo.Fingerprint !== sklKeyInfo.Fingerprint) {
        return throwKTError('Fingerprints differ', { email });
    }

    // Check SHA256Fingerprints
    if (keyInfo.SHA256Fingerprints.length !== sklKeyInfo.SHA256Fingerprints.length) {
        return throwKTError('SHA256Fingerprints length differ', { email });
    }
    keyInfo.SHA256Fingerprints.forEach((sha256Fingerprint, i) => {
        if (sha256Fingerprint !== sklKeyInfo.SHA256Fingerprints[i]) {
            return throwKTError('SHA256Fingerprints differ', { email });
        }
    });

    // Check Flags
    if (keyInfo.Flags !== sklKeyInfo.Flags) {
        return throwKTError('Flags differ', { email });
    }

    // Check primariness
    if (keyInfo.Primary !== sklKeyInfo.Primary) {
        return throwKTError('Primariness differs', { email });
    }
};

/**
 * Check that a list of keys is correctly represented by a Signed Key List
 */
export const verifyKeyList = async (
    email: string,
    keyListInfo: SignedKeyListItem[],
    signedKeyListInfo: SignedKeyListItem[]
) => {
    // Check arrays validity
    if (keyListInfo.length === 0) {
        return throwKTError('No keys detected', { email });
    }
    if (keyListInfo.length !== signedKeyListInfo.length) {
        return throwKTError('Key list and signed key list have different lengths', { email });
    }

    // Sorting both lists just to make sure key infos appear in the same order
    keyListInfo.sort((key1, key2) => {
        return key1.Fingerprint.localeCompare(key2.Fingerprint);
    });
    signedKeyListInfo.sort((key1, key2) => {
        return key1.Fingerprint.localeCompare(key2.Fingerprint);
    });

    // Check keys
    keyListInfo.forEach((key, i) => compareKeyInfo(email, key, signedKeyListInfo[i]));
};

/**
 * Check that the given keys mirror what's inside the given SKL Data
 */
export const checkKeysInSKL = async (email: string, importedKeysWithFlags: KeyWithFlags[], sklData: string) => {
    const parsedSKL = getParsedSignedKeyList(sklData);
    if (!parsedSKL) {
        return throwKTError('SignedKeyList data parsing failed', { sklData });
    }

    const keyListInfo = await parseKeyList(importedKeysWithFlags);
    return verifyKeyList(email, keyListInfo, parsedSKL);
};

export const verifySKLSignature = async (
    verificationKeys: PublicKeyReference[],
    signedKeyListData: string,
    signedKeyListSignature: string,
    verificationTime?: Date
): Promise<Date | null> => {
    const { verified, signatureTimestamp } = await CryptoProxy.verifyMessage({
        armoredSignature: signedKeyListSignature,
        verificationKeys,
        textData: signedKeyListData,
        context: KT_SKL_VERIFICATION_CONTEXT,
        date: verificationTime,
    });
    if (verified !== VERIFICATION_STATUS.SIGNED_AND_VALID) {
        return null;
    }
    return signatureTimestamp;
};

/**
 * Verify that public keys associated to an email address are correctly stored in KT
 */
const verifyPublicKeys = async (
    armoredKeysWithFlags: ArmoredKeyWithFlags[],
    email: string,
    signedKeyList: FetchedSignedKeyList | null,
    api: Api,
    saveSKLToLS: SaveSKLToLS,
    getLatestEpoch: GetLatestEpoch,
    keysIntendedForEmail: boolean,
    isCatchall?: boolean
): Promise<KeyTransparencyVerificationResult> => {
    try {
        if (!signedKeyList || !signedKeyList.Signature) {
            // Absent or obsolete address
            if (keysIntendedForEmail && NO_KT_DOMAINS.includes(getEmailDomain(email))) {
                return { status: KT_VERIFICATION_STATUS.UNVERIFIED_KEYS };
            }
        }

        if (signedKeyList?.Revision === 0) {
            return throwKTError('Signed key list with revision 0', { email });
        }

        // The following checks can only be executed if the SKL is non-obsolescent
        const verifySKL = async () => {
            if (signedKeyList?.Data) {
                const importedKeysWithFlags = await importKeys(armoredKeysWithFlags);
                // Verify key list matches the signed key list
                await checkKeysInSKL(email, importedKeysWithFlags, signedKeyList.Data!);
            }
        };

        const sklVerificationPromise = verifySKL();

        const identifier = isCatchall ? getEmailDomain(email) : email;

        if (signedKeyList && !signedKeyList.MinEpochID) {
            if (!signedKeyList.ExpectedMinEpochID) {
                return throwKTError("SKL doesn't have a MinEpochID or ExpectedMinEpochID set", {
                    email,
                    signedKeyList,
                });
            }
            const data = signedKeyList.Data ?? signedKeyList.ObsolescenceToken;
            if (!data) {
                return throwKTError("SKL doesn't have data or obsolescence token", { email, signedKeyList });
            }
            await sklVerificationPromise;
            await saveSKLToLS(
                email,
                data,
                signedKeyList.Revision,
                signedKeyList.ExpectedMinEpochID,
                undefined,
                isCatchall
            );
            if (signedKeyList.ObsolescenceToken) {
                return { status: KT_VERIFICATION_STATUS.UNVERIFIED_KEYS, keysChangedRecently: true };
            } else {
                return { status: KT_VERIFICATION_STATUS.VERIFIED_KEYS, keysChangedRecently: true };
            }
        }

        let epoch = await getLatestEpoch();

        if (!signedKeyList) {
            const proof = await fetchProof(epoch.EpochID, identifier, 1, api);
            await verifyProofOfAbsenceForAllRevision(proof, identifier, epoch.TreeHash);
            return { status: KT_VERIFICATION_STATUS.UNVERIFIED_KEYS };
        }

        if (epoch.EpochID < signedKeyList.MinEpochID!) {
            // Cache is too old, refetch the last epoch
            epoch = await getLatestEpoch(true);
        }

        const [proof, nextRevisionProof] = await Promise.all([
            fetchProof(epoch.EpochID, identifier, signedKeyList.Revision, api),
            fetchProof(epoch.EpochID, identifier, signedKeyList.Revision + 1, api),
        ]);

        const nextProofVerification = verifyProofOfAbsenceForRevision(
            nextRevisionProof,
            identifier,
            epoch.TreeHash,
            signedKeyList.Revision + 1
        );

        if (signedKeyList.Signature) {
            await Promise.all([
                sklVerificationPromise,
                nextProofVerification,
                verifyProofOfExistence(proof, identifier, epoch.TreeHash, signedKeyList),
            ]);
            return { status: KT_VERIFICATION_STATUS.VERIFIED_KEYS };
        } else {
            await Promise.all([
                sklVerificationPromise,
                nextProofVerification,
                verifyProofOfObsolescence(proof, identifier, epoch.TreeHash, signedKeyList),
            ]);
            return { status: KT_VERIFICATION_STATUS.UNVERIFIED_KEYS };
        }
    } catch (error: any) {
        if (error instanceof KeyTransparencyError) {
            return { status: KT_VERIFICATION_STATUS.VERIFICATION_FAILED };
        }
        throw error;
    }
};

export const verifyPublicKeysAddressAndCatchall = async (
    api: Api,
    saveSKLToLS: SaveSKLToLS,
    getLatestEpoch: GetLatestEpoch,
    email: string,
    keysIntendendedForEmail: boolean,
    address: {
        keyList: ArmoredKeyWithFlags[];
        signedKeyList: FetchedSignedKeyList | null;
    },
    catchAll?: {
        keyList: ArmoredKeyWithFlags[];
        signedKeyList: FetchedSignedKeyList | null;
    }
): Promise<{
    addressKTResult?: KeyTransparencyVerificationResult;
    catchAllKTResult?: KeyTransparencyVerificationResult;
}> => {
    const addressKTStatusPromise = verifyPublicKeys(
        address.keyList,
        email,
        address.signedKeyList,
        api,
        saveSKLToLS,
        getLatestEpoch,
        keysIntendendedForEmail
    );
    let catchAllKTStatusPromise: Promise<KeyTransparencyVerificationResult> | undefined;
    if (address.keyList.length == 0 || catchAll) {
        catchAllKTStatusPromise = verifyPublicKeys(
            catchAll?.keyList ?? [],
            email,
            catchAll?.signedKeyList ?? null,
            api,
            saveSKLToLS,
            getLatestEpoch,
            keysIntendendedForEmail,
            true
        );
    }
    const [addressKTStatus, catchAllKTStatus] = await Promise.all([addressKTStatusPromise, catchAllKTStatusPromise]);
    return {
        addressKTResult: addressKTStatus,
        catchAllKTResult: catchAllKTStatus,
    };
};
