import type { KeyReference, PublicKeyReference } from '@proton/crypto';
import { CryptoProxy, VERIFICATION_STATUS } from '@proton/crypto';
import { saveSKLToLS } from '@proton/key-transparency/lib';
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
import { getParsedSignedKeyList } from '@proton/shared/lib/keys';

import { KT_SKL_VERIFICATION_CONTEXT } from '../constants';
import { NO_KT_DOMAINS } from '../constants/domains';
import { fetchProof } from '../helpers/apiHelpers';
import { KeyTransparencyError, StaleEpochError, getEmailDomain, throwKTError } from '../helpers/utils';
import type { Proof } from '../interfaces';
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
 * Parse a key list into a list of key info
 */
export const parseKeyList = async (keyList: KeyWithFlags[]): Promise<SignedKeyListItem[]> =>
    Promise.all(
        keyList.map(async ({ key, flags, primary }, index) => ({
            Fingerprint: key.getFingerprint(),
            SHA256Fingerprints: await CryptoProxy.getSHA256Fingerprints({ key }),
            Primary: (primary ?? index === 0) ? 1 : 0,
            Flags: flags,
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

interface KeyWithFlags {
    key: KeyReference;
    flags: number;
    primary?: 1 | 0;
}

/**
 * Check that the given keys mirror what's inside the given SKL Data.
 */
export const checkKeysInSKL = async (email: string, apiKeys: KeyWithFlags[], sklData: string) => {
    const parsedSKL = getParsedSignedKeyList(sklData);
    if (!parsedSKL) {
        return throwKTError('SignedKeyList data parsing failed', { sklData });
    }

    const keyListInfo = await parseKeyList(apiKeys);
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
const verifyPublicKeys = async ({
    userContext,
    apiKeys,
    email,
    api,
    signedKeyList,
    getLatestEpoch,
    skipVerificationOfExternalDomains,
    isCatchall,
}: {
    userContext: KTUserContext;
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

        // The following checks can only be executed if the SKL is non-obsolescent
        const verifySKL = async () => {
            if (signedKeyList?.Data) {
                // Verify key list matches the signed key list
                await checkKeysInSKL(
                    email,
                    apiKeys.map(({ publicKey, flags }) => ({ key: publicKey, flags })),
                    signedKeyList.Data!
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
                userContext,
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

        let epoch = await getLatestEpoch();
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
                    epoch = await getLatestEpoch(true);
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
    userContext,
    skipVerificationOfExternalDomains,
}: {
    userContext: KTUserContext;
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
        userContext,
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
            userContext,
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
