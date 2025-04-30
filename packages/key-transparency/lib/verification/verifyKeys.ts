import type { KeyReference, PublicKeyReference } from '@proton/crypto';
import { CryptoProxy, VERIFICATION_STATUS } from '@proton/crypto';
import type {
    Api,
    FetchedSignedKeyList,
    GetLatestEpoch,
    KTUserContext,
    KeyTransparencyVerificationResult,
    ProcessedApiKey,
    SignedKeyListItem,
} from '@proton/shared/lib/interfaces';
import { KT_VERIFICATION_STATUS } from '@proton/shared/lib/interfaces';
import { ParsedSignedKeyList } from '@proton/shared/lib/keys';

import { KT_SKL_VERIFICATION_CONTEXT } from '../constants/constants';
import { NO_KT_DOMAINS } from '../constants/domains';
import { fetchProof } from '../helpers/apiHelpers';
import { KeyTransparencyError, StaleEpochError, getEmailDomain, throwKTError } from '../helpers/utils';
import type { Proof } from '../interfaces';
import { saveSKLToLS } from '../storage/saveSKLToLS';
import {
    verifyProofOfAbsenceForAllRevision,
    verifyProofOfAbsenceForRevision,
    verifyProofOfExistence,
    verifyProofOfObsolescence,
} from './verifyProofs';

/**
 * Check whether the metadata of a key matches what is stored in the Signed Key List
 * @throws if any mismatch is detected
 */
const compareKeyInfo = (email: string, keyInfo: SignedKeyListItem, sklKeyInfo: SignedKeyListItem): void => {
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

interface KeyWithFlags {
    key: KeyReference;
    flags: number;
    primary?: 1 | 0;
}

/**
 * Check that the given keys mirror what's inside the given SKL Data.
 * @throws if any mismatch is detected
 */
export const checkKeysInSKL = (email: string, apiKeys: KeyWithFlags[], sklData: string): void => {
    const signedKeyListInfo = new ParsedSignedKeyList(sklData).getParsedSignedKeyList();
    if (!signedKeyListInfo) {
        return throwKTError('SignedKeyList data parsing failed', { sklData });
    }

    const untrustedKeyListInfo = apiKeys.map(({ key, flags, primary }) => ({
        Fingerprint: key.getFingerprint(),
        SHA256Fingerprints: key.getSHA256Fingerprints(),
        Primary: primary ?? 0,
        Flags: flags,
    }));

    // Check arrays validity
    if (untrustedKeyListInfo.length === 0) {
        return throwKTError('No keys detected', { email });
    }
    if (untrustedKeyListInfo.length !== signedKeyListInfo.length) {
        return throwKTError('Key list and signed key list have different lengths', { email });
    }

    // Sorting both lists just to make sure key infos appear in the same order
    untrustedKeyListInfo.sort((key1, key2) => {
        return key1.Fingerprint.localeCompare(key2.Fingerprint);
    });
    signedKeyListInfo.sort((key1, key2) => {
        return key1.Fingerprint.localeCompare(key2.Fingerprint);
    });

    // Check keys
    untrustedKeyListInfo.forEach((key, i) => compareKeyInfo(email, key, signedKeyListInfo[i]));
};

/**
 * Verify SKL signature using any of the provided verification keys.
 * Verification is not restricted to using the primary keys declared in the SKL,
 * because for older SKLs those keys may no longer be available among the address verification
 * keys (e.g. because the keys were deleted or marked as compromised by the user),
 * and the SKL may have been re-signed using a new primary key.
 * NB: even if the SKL includes a PQC signature, we don't mandate that it verifies over
 * the non-PQC one.
 * @returns verified signature timestamp, or null if verification failed.
 */
export const verifySKLSignature = async ({
    verificationKeys,
    signedKeyListData,
    signedKeyListSignature,
    verificationTime,
}: {
    verificationKeys: PublicKeyReference[];
    signedKeyListData: string;
    signedKeyListSignature: string;
    verificationTime?: Date;
}): Promise<Date | null> => {
    const verificationResult = await CryptoProxy.verifyMessage({
        armoredSignature: signedKeyListSignature,
        verificationKeys,
        textData: signedKeyListData,
        signatureContext: KT_SKL_VERIFICATION_CONTEXT,
        date: verificationTime,
    });
    if (verificationResult.verificationStatus !== VERIFICATION_STATUS.SIGNED_AND_VALID) {
        return null;
    }
    return verificationResult.signatureTimestamp;
};

/**
 * Verify that public keys associated to an email address are correctly stored in KT
 */
const verifyPublicKeys = async ({
    ktUserContext,
    apiKeys,
    email,
    api,
    signedKeyList,
    getLatestEpoch,
    skipVerificationOfExternalDomains,
    isCatchall,
}: {
    ktUserContext: KTUserContext;
    apiKeys: ProcessedApiKey[];
    email: string;
    signedKeyList: FetchedSignedKeyList | null;
    api: Api;
    getLatestEpoch: GetLatestEpoch;
    /**
     * Optimisations for apps where users with external domains do not have valid keys (e.g. Mail)
     */
    skipVerificationOfExternalDomains: boolean;
    isCatchall: boolean;
}): Promise<KeyTransparencyVerificationResult> => {
    try {
        if (!signedKeyList || !signedKeyList.Signature) {
            // Absent or obsolete address
            if (skipVerificationOfExternalDomains && NO_KT_DOMAINS.includes(getEmailDomain(email))) {
                return { status: KT_VERIFICATION_STATUS.UNVERIFIED_KEYS };
            }
        }

        if (signedKeyList?.Revision === 0) {
            return throwKTError('Signed key list with revision 0', { email });
        }

        // The following checks can only be executed if the SKL is non-obsolescent.
        // We use a promise to make it convenient to handle `checkKeysInSKL` throwing.
        const verifySKL = async () => {
            if (signedKeyList?.Data) {
                // Verify key list matches the signed key list
                checkKeysInSKL(
                    email,
                    apiKeys.map(({ publicKey, flags, primary }) => ({ key: publicKey, flags, primary })),
                    signedKeyList.Data
                );
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
            await saveSKLToLS({
                ktUserContext,
                email,
                data,
                revision: signedKeyList.Revision,
                expectedMinEpochID: signedKeyList.ExpectedMinEpochID,
                addressID: undefined,
                isCatchall,
            });
            if (signedKeyList.ObsolescenceToken) {
                return { status: KT_VERIFICATION_STATUS.UNVERIFIED_KEYS, keysChangedRecently: true };
            } else {
                return { status: KT_VERIFICATION_STATUS.VERIFIED_KEYS, keysChangedRecently: true };
            }
        }

        let epoch = await getLatestEpoch({ api });
        // Fetch proofs with cached epoch.
        // If the fetch fails with StaleEpochError retry with a freshly fetched epoch.
        const fetchProofs = async (retry: boolean = true): Promise<{ proof: Proof; nextRevisionProof?: Proof }> => {
            try {
                if (signedKeyList) {
                    const [proof, nextRevisionProof] = await Promise.all([
                        fetchProof(epoch.EpochID, identifier, signedKeyList.Revision, api),
                        fetchProof(epoch.EpochID, identifier, signedKeyList.Revision + 1, api),
                    ]);
                    return { proof, nextRevisionProof };
                } else {
                    const proof = await fetchProof(epoch.EpochID, identifier, 1, api);
                    return { proof };
                }
            } catch (error) {
                if (error instanceof StaleEpochError && retry) {
                    epoch = await getLatestEpoch({ api, forceRefresh: true });
                    return fetchProofs(false);
                }
                throw error;
            }
        };

        const proofs = await fetchProofs();
        if (!signedKeyList) {
            await verifyProofOfAbsenceForAllRevision(proofs.proof, identifier, epoch.TreeHash);
            return { status: KT_VERIFICATION_STATUS.UNVERIFIED_KEYS };
        }

        const nextProofVerification = verifyProofOfAbsenceForRevision(
            proofs.nextRevisionProof!,
            identifier,
            epoch.TreeHash,
            signedKeyList.Revision + 1
        );

        if (signedKeyList.Signature) {
            await Promise.all([
                sklVerificationPromise,
                nextProofVerification,
                verifyProofOfExistence(proofs.proof, identifier, epoch.TreeHash, signedKeyList),
            ]);
            return { status: KT_VERIFICATION_STATUS.VERIFIED_KEYS };
        } else {
            await Promise.all([
                sklVerificationPromise,
                nextProofVerification,
                verifyProofOfObsolescence(proofs.proof, identifier, epoch.TreeHash, signedKeyList),
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

export const verifyPublicKeysAddressAndCatchall = async ({
    api,
    getLatestEpoch,
    address,
    email,
    catchAll,
    ktUserContext,
    skipVerificationOfExternalDomains,
}: {
    ktUserContext: KTUserContext;
    api: Api;
    getLatestEpoch: GetLatestEpoch;
    email: string;
    skipVerificationOfExternalDomains: boolean;
    address: {
        keyList: ProcessedApiKey[];
        signedKeyList: FetchedSignedKeyList | null;
    };
    catchAll?: {
        keyList: ProcessedApiKey[];
        signedKeyList: FetchedSignedKeyList | null;
    };
}): Promise<{
    addressKTResult?: KeyTransparencyVerificationResult;
    catchAllKTResult?: KeyTransparencyVerificationResult;
}> => {
    const addressKTStatusPromise = verifyPublicKeys({
        ktUserContext,
        apiKeys: address.keyList,
        email,
        signedKeyList: address.signedKeyList,
        api,
        getLatestEpoch,
        skipVerificationOfExternalDomains,
        isCatchall: false,
    });
    let catchAllKTStatusPromise: Promise<KeyTransparencyVerificationResult> | undefined;
    if (address.keyList.length == 0 || catchAll) {
        catchAllKTStatusPromise = verifyPublicKeys({
            ktUserContext,
            apiKeys: catchAll?.keyList ?? [],
            email,
            signedKeyList: catchAll?.signedKeyList ?? null,
            api,
            getLatestEpoch,
            skipVerificationOfExternalDomains,
            isCatchall: true,
        });
    }
    const [addressKTStatus, catchAllKTStatus] = await Promise.all([addressKTStatusPromise, catchAllKTStatusPromise]);
    return {
        addressKTResult: addressKTStatus,
        catchAllKTResult: catchAllKTStatus,
    };
};
