import type { PrivateKeyReference } from '@proton/crypto';
import type { Api, KTLocalStorageAPI } from '@proton/shared/lib/interfaces';
import { ParsedSignedKeyList } from '@proton/shared/lib/keys';

import { fetchProof, fetchSignedKeyList } from '../../helpers/apiHelpers';
import {
    KeyTransparencyError,
    getEmailDomain,
    isTimestampOlderThanThreshold,
    isTimestampTooOld,
    throwKTError,
} from '../../helpers/utils';
import type { Epoch, KTBlobContent, KTBlobValuesWithInfo, LocalStorageAuditResult } from '../../interfaces';
import { KTPROOF_TYPE } from '../../interfaces';
import { encryptKTtoLS, getAllKTBlobValuesWithInfo, removeKTFromLS } from '../../storage/storageHelpers';
import { verifyProofOfExistenceOrObsolescence } from './../verifyProofs';

enum LocalStorageAuditStatus {
    Success,
    Failure,
    RetryLater,
}

const fetchSKLWithRevision = async (api: Api, email: string, revision: number, data: string) => {
    const includedSKL = await fetchSignedKeyList(api, revision, email);
    if (!includedSKL) {
        return throwKTError('Could not find new SKL with same revision', { email, revision });
    }

    if (includedSKL.Data != data && includedSKL.ObsolescenceToken != data) {
        return throwKTError('SKL data has changed for revision', {
            email,
            revision,
            savedData: data,
            includedSKL,
        });
    }

    return includedSKL;
};

const getPrimaryKeyFingerprint = (blob: KTBlobContent) => {
    const sklItems = new ParsedSignedKeyList(blob.data).getParsedSignedKeyList();
    if (sklItems?.length) {
        return sklItems[0].Fingerprint;
    }
};

/**
 * Verify that the SKL(s) stored in one (or more) localStorage blob(s)
 * are correctly committed to KT
 */
const verifyKTBlobContent = async (
    epoch: Epoch,
    ktBlobContent: KTBlobContent,
    api: Api
): Promise<LocalStorageAuditStatus> => {
    try {
        const { email, expectedMinEpochID, data, revision, creationTimestamp, isCatchall } = ktBlobContent;

        if (!isTimestampTooOld(creationTimestamp) && expectedMinEpochID > epoch.EpochID) {
            return LocalStorageAuditStatus.RetryLater;
        }

        const identifier = isCatchall ? getEmailDomain(email) : email;

        const proof = await fetchProof(epoch.EpochID, identifier, revision, api);

        if (proof.Type === KTPROOF_TYPE.ABSENCE) {
            if (isTimestampOlderThanThreshold(creationTimestamp)) {
                // Revision is old, might have been garbage collected
                return LocalStorageAuditStatus.Success;
            } else {
                if (isTimestampTooOld(creationTimestamp)) {
                    return throwKTError('SKL revision was ignored after more than max allowed interval', {
                        email,
                        revision,
                    });
                } else {
                    return LocalStorageAuditStatus.RetryLater;
                }
            }
        }

        const includedSKL = await fetchSKLWithRevision(api, identifier, revision, data);

        await verifyProofOfExistenceOrObsolescence(proof, identifier, epoch.TreeHash, includedSKL);
        return LocalStorageAuditStatus.Success;
    } catch (error: any) {
        if (error instanceof KeyTransparencyError) {
            return LocalStorageAuditStatus.Failure;
        }
        throw error;
    }
};

/**
 * Check local storage for any previously stored KT blobs
 * that need to be verified
 */
export const checkLSBlobs = async (
    userID: string,
    userPrivateKeys: PrivateKeyReference[],
    ktLSAPI: KTLocalStorageAPI,
    epoch: Epoch,
    api: Api
): Promise<LocalStorageAuditResult[]> => {
    const ktBlobsMap = await getAllKTBlobValuesWithInfo(userID, userPrivateKeys, ktLSAPI);
    const results = [];
    for (const { addressID, ktBlobsContent } of ktBlobsMap.values()) {
        const blobsToSave = [];
        for (const ktBlobContent of ktBlobsContent) {
            const result = await verifyKTBlobContent(epoch, ktBlobContent, api);
            if (result === LocalStorageAuditStatus.RetryLater) {
                blobsToSave.push(ktBlobContent);
            } else {
                results.push({
                    email: ktBlobContent.email,
                    primaryKeyFingerprint: getPrimaryKeyFingerprint(ktBlobContent),
                    success: result === LocalStorageAuditStatus.Success,
                });
            }
        }
        await removeKTFromLS(userID, addressID, ktLSAPI);
        if (blobsToSave.length) {
            const blobs: KTBlobValuesWithInfo = { userID, addressID, ktBlobsContent: blobsToSave };
            await encryptKTtoLS(blobs, userPrivateKeys[0], ktLSAPI);
        }
    }

    return results;
};
